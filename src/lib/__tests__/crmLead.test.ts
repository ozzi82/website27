import { afterEach, describe, expect, it, vi } from "vitest";
import { leadFields, leadFormData, readFormValues, sendLeadToCrm } from "../crmLead";

const SUMMARY = "Configuration: LP 11-F Block Acrylic Face-lit\nText: SUNLITE\nSize: 100″ × 17″";

describe("configurator quote → CRM lead", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads what the visitor typed, without files, buttons, the captcha or unticked boxes", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <form>
        <input name="firstname" value=" Pat ">
        <input name="lastname" value="Shop">
        <input name="email" type="email" value="pat@signshop.test">
        <input name="company" value="Sign Shop LLC">
        <input name="phone" value="">
        <textarea name="message">${SUMMARY}\n\nNeed it by March.</textarea>
        <input name="upload_your_file_here" type="file">
        <input name="g-recaptcha-response" value="token">
        <input name="newsletter" type="checkbox" value="yes">
        <input type="submit" name="go" value="Send">
      </form>`;
    document.body.appendChild(root);
    expect(readFormValues(root)).toEqual({ firstname: "Pat", lastname: "Shop", email: "pat@signshop.test", company: "Sign Shop LLC", message: `${SUMMARY}\n\nNeed it by March.` });
    root.remove();
  });

  it("maps the HubSpot fields to the CRM's, keeping only the visitor's own words as the message", () => {
    const fields = leadFields({ firstname: "Pat", lastname: "Shop", email: "pat@signshop.test", company: "Sign Shop LLC", phone: "555-0100", message: `${SUMMARY}\n\nNeed it by March.` }, SUMMARY);
    expect(fields).toEqual({ email: "pat@signshop.test", name: "Pat Shop", company: "Sign Shop LLC", phone: "555-0100", message: "Need it by March.", configuration: SUMMARY });
    // Nothing typed besides the summary: no message; no email: no lead.
    expect(leadFields({ email: "a@b.test", message: SUMMARY }, SUMMARY)).toEqual({ email: "a@b.test", configuration: SUMMARY });
    expect(leadFields({ firstname: "Pat" }, SUMMARY)).toBeNull();
  });

  it("sends the fields, the campaign tags and both files", () => {
    const art = new File(["<svg/>"], "sunlite-text-sunlite.svg", { type: "image/svg+xml" });
    const pic = new File(["jpg"], "sign-configuration-summary.jpg", { type: "image/jpeg" });
    const body = leadFormData({ email: "pat@signshop.test", configuration: SUMMARY }, [art, pic], { gclid: "G1", utm_source: "google", other: "x" });
    expect(body.get("email")).toBe("pat@signshop.test");
    expect(body.get("configuration")).toBe(SUMMARY);
    expect(body.get("source")).toBe("configurator");
    expect(body.get("gclid")).toBe("G1");
    expect(body.get("utm_source")).toBe("google");
    expect(body.has("other")).toBe(false);
    expect((body.getAll("file") as File[]).map((f) => f.name)).toEqual(["sunlite-text-sunlite.svg", "sign-configuration-summary.jpg"]);
  });

  it("posts to the CRM and never throws, whatever the CRM says", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendLeadToCrm({ email: "a@b.test", configuration: SUMMARY }, [], {}, "https://crm.test/quote/submit")).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("https://crm.test/quote/submit", expect.objectContaining({ method: "POST", credentials: "omit" }));
    fetchMock.mockResolvedValueOnce({ ok: false });
    expect(await sendLeadToCrm({ email: "a@b.test", configuration: SUMMARY }, [], {}, "https://crm.test/quote/submit")).toBe(false);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(await sendLeadToCrm({ email: "a@b.test", configuration: SUMMARY }, [], {}, "https://crm.test/quote/submit")).toBe(false);
    // Switched off: nothing is sent.
    fetchMock.mockClear();
    expect(await sendLeadToCrm({ email: "a@b.test", configuration: SUMMARY }, [], {}, "")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
