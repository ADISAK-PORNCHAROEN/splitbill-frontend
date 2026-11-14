import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { Select } from "../../src/components/ui/select";
import { Textarea } from "../../src/components/ui/textarea";

describe("shared controls", () => {
  it("defaults buttons to a non-submitting type and supports disabled state", () => {
    const html = renderToStaticMarkup(<Button disabled>Cancel</Button>);
    expect(html).toContain('type="button"');
    expect(html).toContain("disabled");
    expect(html).toContain("Cancel");
  });

  it("forwards native accessibility and form attributes", () => {
    expect(renderToStaticMarkup(<Input aria-label="Amount" name="amount" required />))
      .toContain('aria-label="Amount"');
    expect(renderToStaticMarkup(<Textarea aria-label="Description" name="description" />))
      .toContain('name="description"');
    expect(renderToStaticMarkup(<Select aria-label="Payer"><option>Alice</option></Select>))
      .toContain("Alice");
  });
});
