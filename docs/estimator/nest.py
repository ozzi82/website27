import re, subprocess, sys, math, json
SHEET=(1219.0, 2438.0)  # 4 x 8 ft in mm
GAP=12.0                # mm between parts (kerf + margin)

def run(cmd): return subprocess.run(cmd,shell=True,capture_output=True,text=True)

def components(mask, min_area=1500):
    out=run(f'convert {mask} -define connected-components:verbose=true -define connected-components:area-threshold=60 -connected-components 4 null: 2>&1').stdout
    comps=[]
    for ln in out.splitlines():
        m=re.match(r'\s*(\d+): (\d+)x(\d+)\+(\d+)\+(\d+) [\d.]+,[\d.]+ (\d+) gray\((\d+)\)',ln)
        if m:
            i,w,h,x,y,a,c=map(int,m.groups())
            comps.append(dict(id=i,w=w,h=h,x=x,y=y,area=a,white=(c==255)))
    return comps

def contained(a,b):
    return a['x']>=b['x']-2 and a['y']>=b['y']-2 and a['x']+a['w']<=b['x']+b['w']+2 and a['y']+a['h']<=b['y']+b['h']+2 and a is not b

def bodies(comps, min_area, mask=None):
    whites=[c for c in comps if c['white'] and c['area']>=min_area]
    if not whites: return []
    ext=max(whites,key=lambda c:c['area'])  # the page background around the artwork
    whites=[c for c in whites if c is not ext]
    cand=[c for c in whites if any(contained(c,o) for o in whites)]
    keep=[c for c in whites if c not in cand]
    if mask is None: return keep
    # a nested piece is a separate part (not a hole) if the first white pixel outside its outline is page background
    flooded=mask.replace('.png','_ext.png')
    run(f'convert {mask} -fill "gray(128)" -draw "color 0,0 floodfill" {flooded}')
    for c in cand:
        votes=0; total=0
        for frac in (0.3,0.5,0.7):
            cy=int(c['y']+c['h']*frac)
            x=max(0,c['x']-1)
            width=max(1,min(60,x))
            out=run(f'convert {flooded} -crop {width}x1+{x-width+1}+{cy} +repage -colorspace Gray txt:-').stdout.splitlines()[1:]
            px=[]
            for ln in out:
                m=re.match(r'(\d+),\d+: \((\d+)',ln)
                if m: px.append((int(m.group(1)),int(m.group(2))))
            px.sort(reverse=True)  # from the comp outward (right to left)
            seen_black=False; verdict=None
            for _,v in px:
                if v<60: seen_black=True; continue
                if seen_black: verdict='ext' if 100<v<160 else 'body'; break
            if verdict is None and px and px[-1][0]==0: verdict='ext'
            if verdict: total+=1; votes+= (verdict=='ext')
        if total and votes*2>total: keep.append(c)
    return keep

def shelf_pack(parts, sheet=SHEET, gap=GAP):
    """First-fit-decreasing shelf packing of rectangles, parts may rotate 90 degrees."""
    W,H=sheet
    parts=sorted(parts,key=lambda p:-max(p))
    sheets=[]  # each: list of shelves [y, height, used_x]
    for (w,h) in parts:
        placed=False
        for orient in ((w,h),(h,w)):
            pw,ph=orient
            if pw>W or ph>H: continue
        for s in sheets:
            for sh in s['shelves']:
                for pw,ph in ((w,h),(h,w)):
                    if ph<=sh['h'] and sh['x']+pw<=H and pw<=H:
                        sh['x']+=pw+gap; placed=True; break
                if placed: break
            if placed: break
            # new shelf on this sheet
            used=sum(sh['h']+gap for sh in s['shelves'])
            for pw,ph in ((w,h),(h,w)):
                if pw<=H and used+ph<=W:
                    s['shelves'].append({'h':ph,'x':pw+gap}); placed=True; break
            if placed: break
        if not placed:
            for pw,ph in ((w,h),(h,w)):
                if pw<=H and ph<=W:
                    sheets.append({'shelves':[{'h':ph,'x':pw+gap}]}); placed=True; break
        if not placed:
            sheets.append({'shelves':[{'h':min(w,h),'x':max(w,h)}],'oversize':True})
    return len(sheets)

def analyse(name, mask, real_width_mm, depth_mm, min_area=1500):
    comps=components(mask)
    bs=bodies(comps,min_area)
    x0=min(c['x'] for c in bs); x1=max(c['x']+c['w'] for c in bs)
    scale=real_width_mm/(x1-x0)     # mm per pixel
    area=sum(c['area'] for c in bs)*scale*scale
    boxes=[(c['w']*scale,c['h']*scale) for c in bs]
    # perimeter: black line pixels after thinning
    sk=run(f'convert {mask} -negate -morphology Thinning:-1 Skeleton -format "%[fx:mean*w*h]" info:').stdout.strip()
    skpx=float(sk) if sk else float('nan')
    per=skpx*scale*1.0
    sheets_faces=shelf_pack([(w+0,h+0) for w,h in boxes])
    side_area=per*depth_mm
    return dict(name=name,parts=len(bs),scale_mm_px=round(scale,3),face_area_m2=round(area/1e6,3),perimeter_m=round(per/1000,2),
        bbox_area_m2=round(sum(w*h for w,h in boxes)/1e6,3),sheets_faces=sheets_faces,
        sheet_equiv_ideal=round(area/ (SHEET[0]*SHEET[1]) ,2), side_strip_m2=round(side_area/1e6,3),
        side_sheet_equiv=round(side_area/(SHEET[0]*SHEET[1]*0.9),2),
        biggest_mm=[round(max(boxes,key=lambda b:b[0]*b[1])[0]),round(max(boxes,key=lambda b:b[0]*b[1])[1])])
if __name__=="__main__":
    print(json.dumps(analyse(sys.argv[1],sys.argv[2],float(sys.argv[3]),float(sys.argv[4])),indent=1))
