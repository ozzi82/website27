import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { describe, expect, it } from "vitest";
import DepthComparison from "../DepthComparison";
import ProjectCard from "../ProjectCard";
import MediaFrame from "../MediaFrame";
import ProductionStageCard from "../ProductionStageCard";
import { PrimaryCta, ArrowLink } from "../CtaButton";
import type { Project } from "../../data/projects";
import { productionStages } from "../../data/production";

const wrap = (ui: React.ReactElement, path = "/") => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

describe("DepthComparison", () => {
  it("is an image with an accessible title and description naming both letters, saying the conventional one is not built by Sunlite, and 25-30 mm", () => {
    render(<DepthComparison />);
    const svg = screen.getByRole("img");
    expect(svg).toHaveAccessibleName(/conventional trim-cap channel letter, a type Sunlite does not build, versus Sunlite Ultra-Slim LP 11/i);
    expect(svg).toHaveAccessibleDescription(/25 to 30 millimetres/i);
    expect(svg).toHaveAccessibleDescription(/not to scale/i);
    expect(svg).toHaveAccessibleDescription(/does not build/i);
  });

  it("labels both profiles and the ultra-slim depth, with no depth number for the conventional letter", () => {
    const { container } = render(<DepthComparison />);
    const text = container.querySelector("svg")!.textContent!;
    expect(text).toContain("CONVENTIONAL TRIM-CAP LETTER");
    expect(text).toContain("A TYPE SUNLITE DOES NOT BUILD");
    expect(text).toContain("SUNLITE ULTRA-SLIM (LP 11)");
    expect(text).toContain("25–30 mm");
    // The only millimetre figure in the drawing is the ultra-slim one: nothing is claimed for the conventional return.
    expect(text.match(/\d+\s?mm/g)).toEqual(["30 mm"]);
    expect(text).not.toMatch(/\d+\s?(in|inch|")(?!\w)/);
  });

  it("shows the illustrative note by default and can hide it", () => {
    const { rerender } = render(<DepthComparison />);
    expect(screen.getByText(/illustrative side profiles, not to scale/i)).toBeInTheDocument();
    expect(screen.getByText(/trim-cap channel letter, a type sunlite does not build/i)).toBeInTheDocument();
    rerender(<DepthComparison hideNote />);
    expect(screen.queryByText(/illustrative side profiles/i)).not.toBeInTheDocument();
  });

  it("scales with its container (viewBox, no fixed pixel width) and has a larger variant", () => {
    const { container, rerender } = render(<DepthComparison />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 330 322");
    expect(svg.getAttribute("width")).toBeNull();
    expect(container.querySelector("figure")!.className).toContain("max-w-md");
    rerender(<DepthComparison size="lg" />);
    expect(container.querySelector("figure")!.className).toContain("max-w-3xl");
  });

  it("generates unique ids so two instances on a page do not collide", () => {
    const { container } = render(
      <>
        <DepthComparison />
        <DepthComparison />
      </>,
    );
    const ids = [...container.querySelectorAll("[id]")].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("ProjectCard", () => {
  const base: Project = { id: "p", title: "Tradebyte", image: "/images/x.jpg", width: 1600, height: 1200, alt: "Tradebyte lettering on a wall" };

  it("renders only the title and image when no metadata is known", () => {
    const { container } = wrap(<ProjectCard project={base} index={0} />);
    expect(screen.getByRole("heading", { name: "Tradebyte" })).toBeInTheDocument();
    expect(screen.getByAltText("Tradebyte lettering on a wall")).toHaveAttribute("loading", "lazy");
    expect(container.querySelector("dl")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Fig. 01")).toBeInTheDocument();
  });

  it("renders only the metadata rows that are present", () => {
    wrap(<ProjectCard project={{ ...base, depth: "28 mm", mounting: "Remote mounted" }} />);
    expect(screen.getByText("Depth")).toBeInTheDocument();
    expect(screen.getByText("28 mm")).toBeInTheDocument();
    expect(screen.getByText("Mounting")).toBeInTheDocument();
    expect(screen.queryByText("Finish")).toBeNull();
    expect(screen.queryByText("Illumination")).toBeNull();
  });

  it("links back to its product page when a slug is set", () => {
    wrap(<ProjectCard project={{ ...base, productType: "Channel letters", productSlug: "channel-letters" }} />);
    expect(screen.getByRole("link", { name: /view channel letters/i })).toHaveAttribute("href", "/services/channel-letters");
  });
});

describe("MediaFrame", () => {
  const image = { src: "/images/a.jpg", alt: "Bench", width: 800, height: 500 };
  const video = { src: "/video/a.mp4", type: "video/mp4", poster: { src: "/images/poster.jpg", alt: "Packaging line", width: 1280, height: 720 } };

  it("lazy-loads images with explicit dimensions", () => {
    render(<MediaFrame image={image} />);
    const img = screen.getByAltText("Bench");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("width", "800");
    expect(img).toHaveAttribute("height", "500");
  });

  it("loads eagerly when priority is set", () => {
    render(<MediaFrame image={image} priority />);
    expect(screen.getByAltText("Bench")).toHaveAttribute("loading", "eager");
  });

  it("shows a poster and does not request the video until play is pressed", async () => {
    const { container } = render(<MediaFrame video={video} />);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("source")).toBeNull();
    expect(screen.getByAltText("Packaging line")).toHaveAttribute("loading", "lazy");
    await userEvent.click(screen.getByRole("button", { name: /play video: packaging line/i }));
    const v = container.querySelector("video")!;
    expect(v).toBeInTheDocument();
    expect(v.querySelector("source")).toHaveAttribute("src", "/video/a.mp4");
    expect(v).toHaveAttribute("poster", "/images/poster.jpg");
  });

  it("renders the placeholder when there is no media", () => {
    render(<MediaFrame placeholder={<span>blueprint</span>} />);
    expect(screen.getByText("blueprint")).toBeInTheDocument();
  });
});

describe("ProductionStageCard", () => {
  it("renders a real photo where one exists", () => {
    wrap(<ProductionStageCard stage={productionStages[0]} />);
    expect(screen.getByRole("heading", { name: "CNC Fabrication" })).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", productionStages[0].image!.src);
  });

  it("renders a typographic placeholder (no img) where there is no asset yet", () => {
    const { container } = wrap(<ProductionStageCard stage={productionStages[3]} />);
    expect(screen.getByRole("heading", { name: "Quality Control" })).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Stage 04")).toBeInTheDocument();
  });
});

describe("CTA components", () => {
  it("PrimaryCta links to /contact with the single wording", () => {
    wrap(<PrimaryCta />);
    expect(screen.getByRole("link", { name: /request wholesale pricing/i })).toHaveAttribute("href", "/contact");
  });

  it("ArrowLink renders an internal link", () => {
    wrap(<ArrowLink label="Explore Ultra-Slim" to="/services/ultra-slim-trimless-channel-letters" />);
    expect(screen.getByRole("link", { name: "Explore Ultra-Slim" })).toHaveAttribute("href", "/services/ultra-slim-trimless-channel-letters");
  });
});
