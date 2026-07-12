import "@testing-library/jest-dom";
import "../setup";
import { afterEach, describe, expect, test } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ActiveFilterChips } from "hub/components/spec/ActiveFilterChips";

afterEach(() => {
  cleanup();
});

describe("ActiveFilterChips", () => {
  test("renders chips for each active filter", () => {
    render(
      <ActiveFilterChips
        filters={{
          type: "openapi",
          owner: "payments-team",
          tags: ["payments", "public"],
          classification: "patch",
        }}
        onChange={() => {}}
      />
    );

    expect(screen.getByText("Type: openapi")).toBeTruthy();
    expect(screen.getByText("Owner: payments-team")).toBeTruthy();
    expect(screen.getByText("Tag: payments")).toBeTruthy();
    expect(screen.getByText("Tag: public")).toBeTruthy();
    expect(screen.getByText("Classification: Patch")).toBeTruthy();
  });

  test("removes a single filter when chip X is clicked", () => {
    let latest = {};
    render(
      <ActiveFilterChips
        filters={{ type: "openapi", tags: ["payments"] }}
        onChange={(f) => {
          latest = f;
        }}
      />
    );

    const removeButtons = screen.getAllByRole("button", { name: /Remove/i });
    expect(removeButtons.length).toBe(2);

    fireEvent.click(removeButtons[0]);
    expect(latest).toEqual({ tags: ["payments"] });
  });

  test("clears all filters when Clear all is clicked", () => {
    let latest = {};
    render(
      <ActiveFilterChips
        filters={{ type: "openapi", tags: ["payments"] }}
        onChange={(f) => {
          latest = f;
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Clear all/i }));
    expect(latest).toEqual({});
  });

  test("renders nothing when no filters are active", () => {
    const { container } = render(
      <ActiveFilterChips filters={{}} onChange={() => {}} />
    );

    expect(container.firstChild).toBeNull();
  });
});
