import { afterEach, describe, expect, test, vi } from "vitest";
import ProfileMenu, { profileInitials } from "@/components/profile-menu";
import Toolbar from "@/components/toolbar";
import { byLabel, byText, cleanup, fire, render } from "@/components/widgets/test-dom";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

afterEach(cleanup);

describe("profileInitials", () => {
  test("uses the first two characters, upper-cased", () => {
    expect(profileInitials("pndadmin")).toBe("PN");
    expect(profileInitials("a")).toBe("A");
    expect(profileInitials("  ")).toBe("?");
  });
});

describe("ProfileMenu", () => {
  function setup(overrides: Partial<React.ComponentProps<typeof ProfileMenu>> = {}) {
    const calls = { edit: 0, phone: 0, logout: 0 };
    const view = render(
      <ProfileMenu
        username="pndadmin"
        editMode={false}
        onToggleEdit={() => { calls.edit++; }}
        links={["users", "settings"]}
        onLogout={() => { calls.logout++; }}
        btnStyle={{}}
        {...overrides}
      />
    );
    return { ...view, calls };
  }

  test("shows the initials and opens a menu with everything in it", () => {
    const { container } = setup();
    const button = byLabel(container, "Profile menu")!;
    expect(button.textContent).toBe("PN");
    expect(container.querySelector('[role="menu"]')).toBeNull();

    fire.click(button);
    expect(byText(container, "pndadmin")).not.toBeNull();
    expect(byText(container, "Edit layout")).not.toBeNull();
    expect(byText(container, "Users")).not.toBeNull();
    expect(byText(container, "Sign out")).not.toBeNull();
  });

  test("menu actions run and close the menu", () => {
    const { container, calls } = setup();
    fire.click(byLabel(container, "Profile menu")!);
    fire.click(byText(container, "Edit layout")!);
    expect(calls.edit).toBe(1);
    expect(container.querySelector('[role="menu"]')).toBeNull();

    fire.click(byLabel(container, "Profile menu")!);
    fire.click(byText(container, "Sign out")!);
    expect(calls.logout).toBe(1);
  });

  test("phone layout only appears when offered (while editing)", () => {
    const { container } = setup();
    fire.click(byLabel(container, "Profile menu")!);
    expect(byText(container, "Phone layout")).toBeNull();
    cleanup();

    const withPhone = setup({ editMode: true, onMobileEditorToggle: () => {} });
    fire.click(byLabel(withPhone.container, "Profile menu")!);
    expect(byText(withPhone.container, "Phone layout")).not.toBeNull();
    expect(byText(withPhone.container, "Stop editing")).not.toBeNull();
    expect(withPhone.container.querySelector('[data-testid="editing-dot"]')).not.toBeNull();
  });

  test("a viewer who can't edit just gets their name and sign out", () => {
    const { container } = setup({ onToggleEdit: undefined, links: [] });
    fire.click(byLabel(container, "Profile menu")!);
    expect(byText(container, "Edit layout")).toBeNull();
    expect(container.querySelectorAll('[role="menuitem"]')).toHaveLength(1);
  });
});

describe("Toolbar", () => {
  test("signed in: one profile button instead of separate edit, phone and sign-out buttons", () => {
    const { container } = render(
      <Toolbar editMode canEdit loggedIn username="pndadmin" onToggleEdit={() => {}}
        onMobileEditorToggle={() => {}} adminLinks={["users"]} />
    );
    expect(byLabel(container, "Profile menu")).not.toBeNull();
    expect(container.querySelector('[title="Sign out"]')).toBeNull();
    expect(container.querySelector('[title="Mobile layout"]')).toBeNull();
    expect(container.querySelector('[title="Admin"]')).toBeNull();
  });

  test("signed out: shown as Guest, and the menu offers Sign in", () => {
    const { container } = render(<Toolbar editMode={false} onToggleEdit={() => {}} adminLinks={[]} />);
    const button = byLabel(container, "Profile menu")!;
    expect(button.textContent).toBe("GU");
    fire.click(button);
    expect(byText(container, "Viewing as")).not.toBeNull();
    expect(byText(container, "Guest")).not.toBeNull();
    expect(container.querySelector('a[href="/login"]')).not.toBeNull();
    expect(byText(container, "Sign out")).toBeNull();
    expect(byText(container, "Edit layout")).toBeNull();
  });
});
