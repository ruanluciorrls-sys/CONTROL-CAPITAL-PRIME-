import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { navigateToTab } from "@/lib/navigate";

const fixtures = vi.hoisted(() => {
  function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>(done => { resolve = done; });
    return { promise, resolve };
  }

  return {
    saldo: 10,
    isPrimaryAdmin: false,
    role: "user",
    faturamento: deferred(),
    chavesPix: deferred(),
  };
});

vi.mock("@/contexts/AppContext", () => ({
  AppProvider: ({ children }: React.PropsWithChildren) => children,
  useApp: () => ({ state: {} }),
}));
vi.mock("@/contexts/SupabaseContext", () => ({
  SupabaseProvider: ({ children }: React.PropsWithChildren) => children,
}));
vi.mock("@/contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: React.PropsWithChildren) => children,
  useTheme: () => ({ theme: "dark", toggleTheme: vi.fn() }),
}));
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { name: "Teste", role: fixtures.role, isPrimaryAdmin: fixtures.isPrimaryAdmin },
    loading: false,
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: { auth: { changePassword: { useMutation: () => ({}) } } },
}));
vi.mock("@/components/NotificationCenter", () => ({ default: () => null }));
vi.mock("@/components/Celebracao", () => ({ default: () => null }));
vi.mock("@/components/InstallButton", () => ({ default: () => null }));
vi.mock("@/pages/Login", () => ({ default: () => null }));
vi.mock("@/pages/Dashboard", () => ({
  default: () => <h2>Saldo: {fixtures.saldo}</h2>,
}));
vi.mock("@/pages/Faturamento", async () => {
  await fixtures.faturamento.promise;
  return { default: () => <h2>Tela de faturamento</h2> };
});
vi.mock("@/pages/ChavesPix", async () => {
  await fixtures.chavesPix.promise;
  return { default: () => <h2>Tela de PIX</h2> };
});
vi.mock("@/pages/Contas", () => ({
  default: () => <h2>Tela de contas</h2>,
}));
vi.mock("@/pages/AdminPanel", () => ({
  default: () => <h2>Tela de admin</h2>,
}));

describe("fade global de paginas", () => {
  const animate = vi.fn(() => ({ cancel: vi.fn() }));
  let motion: EventTarget & { matches: boolean };

  beforeEach(() => {
    fixtures.saldo = 10;
    fixtures.isPrimaryAdmin = false;
    fixtures.role = "user";
    localStorage.removeItem("lastActiveTab");
    motion = Object.assign(new EventTarget(), { matches: false });
    vi.stubGlobal("matchMedia", vi.fn(() => motion));
    Object.defineProperty(Element.prototype, "animate", {
      configurable: true,
      value: animate,
    });
  });

  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(Element.prototype, "animate");
    vi.unstubAllGlobals();
    vi.useRealTimers();
    animate.mockClear();
  });

  it("espera a tela lazy e anima so o conteudo, mantendo o shell", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Saldo: 10" });
    const main = screen.getByRole("main");
    const menu = screen.getByRole("navigation");
    const mobileMenu = screen.getByRole("button", { name: "Abrir menu" });
    const logos = screen.getAllByRole("heading", { name: "CAPITAL PRIME" });
    expect(within(menu).getByRole("button", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    expect(animate).not.toHaveBeenCalled();

    fireEvent.click(within(menu).getByRole("button", { name: "Faturamento" }));
    expect(within(menu).getByRole("button", { name: "Faturamento" })).toHaveAttribute("aria-current", "page");
    expect(animate).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Tela de faturamento" })).toBeNull();

    fixtures.faturamento.resolve();
    await screen.findByRole("heading", { name: "Tela de faturamento" });
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.contexts[0]).toBe(main);
    expect(animate).toHaveBeenCalledWith(
      [{ opacity: 0.75 }, { opacity: 1 }],
      { duration: 180, easing: "ease-out" },
    );
    expect(screen.getByRole("navigation")).toBe(menu);
    expect(screen.getByRole("button", { name: "Abrir menu" })).toBe(mobileMenu);
    screen.getAllByRole("heading", { name: "CAPITAL PRIME" })
      .forEach((logo, index) => expect(logo).toBe(logos[index]));

    fireEvent.click(mobileMenu);
    const [mobileNavigation] = screen.getAllByRole("navigation").filter(nav => nav !== menu);
    fireEvent.click(within(mobileNavigation).getByRole("button", { name: "Dashboard" }));
    await screen.findByRole("heading", { name: "Saldo: 10" });
    expect(animate).toHaveBeenCalledTimes(2);
    expect(animate.mock.results[0].value.cancel).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Abrir menu" })).toBe(mobileMenu);
  });

  it("recarrega pelo menu lateral com teclado sem animar a pagina", async () => {
    const view = render(<App />);
    const original = await screen.findByRole("heading", { name: "Saldo: 10" });
    const main = screen.getByRole("main");

    fixtures.saldo = 25;
    view.rerender(<App />);
    expect(screen.getByRole("heading", { name: "Saldo: 25" })).toBe(original);
    fireEvent.click(screen.getByRole("button", { name: "Dashboard" }));

    const sidebar = within(screen.getByRole("complementary"));
    expect(sidebar.queryByRole("button", { name: "Atualizar" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Recarregar dados" })).toBeNull();
    const trigger = sidebar.getByRole("button", { name: /^Mais a/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    const reload = screen.getByRole("menuitem", { name: "Recarregar dados" });
    expect(reload).toHaveFocus();

    vi.useFakeTimers();
    fireEvent.keyDown(reload, { key: "Enter" });
    expect(screen.queryByRole("menuitem", { name: "Recarregar dados" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Saldo: 25" })).not.toBe(original);
    expect(screen.getByRole("main")).toBe(main);
    act(() => vi.advanceTimersByTime(0));
    expect(trigger).toHaveFocus();

    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(screen.getByRole("menuitem", { name: "Recarregar dados" })).toHaveAttribute("aria-disabled", "true");
    act(() => vi.advanceTimersByTime(800));
    expect(screen.getByRole("menuitem", { name: "Recarregar dados" })).not.toHaveAttribute("aria-disabled");
    expect(animate).not.toHaveBeenCalled();
  });

  it.each([
    { role: "user", isPrimaryAdmin: false },
    { role: "admin", isPrimaryAdmin: false },
    { role: "admin", isPrimaryAdmin: true },
  ])("usa a logo do app no perfil e preserva o acesso ao Painel Admin (%j)", async ({ role, isPrimaryAdmin }) => {
    fixtures.role = role;
    fixtures.isPrimaryAdmin = isPrimaryAdmin;
    render(<App />);
    await screen.findByRole("heading", { name: "Saldo: 10" });

    const sidebar = within(screen.getByRole("complementary"));
    expect(sidebar.getByRole("img", { name: "Capital Prime Control" })).toHaveAttribute("src", "/icon.svg");
    expect(sidebar.getByText("Teste")).toBeInTheDocument();
    expect(sidebar.queryByText("T", { exact: true })).toBeNull();
    expect(Boolean(sidebar.queryByRole("button", { name: "Painel Admin" }))).toBe(isPrimaryAdmin);
  });

  it("ignora aliases da mesma tela e mudancas de permissao sem navegacao", async () => {
    localStorage.setItem("lastActiveTab", "admin");
    const view = render(<App />);
    await screen.findByRole("heading", { name: "Saldo: 10" });
    fireEvent.click(screen.getByRole("button", { name: "Dashboard" }));
    expect(animate).not.toHaveBeenCalled();

    act(() => navigateToTab("admin"));
    fixtures.isPrimaryAdmin = true;
    view.rerender(<App />);
    await screen.findByRole("heading", { name: "Tela de admin" });
    expect(animate).not.toHaveBeenCalled();
  });

  it("respeita movimento reduzido, inclusive se ativado durante o fade", async () => {
    motion.matches = true;
    render(<App />);
    await screen.findByRole("heading", { name: "Saldo: 10" });

    act(() => navigateToTab("contas"));
    await screen.findByRole("heading", { name: "Tela de contas" });
    expect(window.matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
    expect(animate).not.toHaveBeenCalled();

    motion.matches = false;
    act(() => navigateToTab("dashboard"));
    await screen.findByRole("heading", { name: "Saldo: 10" });
    expect(animate).toHaveBeenCalledTimes(1);

    motion.matches = true;
    motion.dispatchEvent(Object.assign(new Event("change"), { matches: true }));
    expect(animate.mock.results[0].value.cancel).toHaveBeenCalledTimes(1);
  });

  it("nao anima uma tela lazy abandonada em uma troca rapida", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Saldo: 10" });
    act(() => navigateToTab("chaves-pix"));
    expect(animate).not.toHaveBeenCalled();

    act(() => navigateToTab("contas"));
    await screen.findByRole("heading", { name: "Tela de contas" });
    expect(animate).toHaveBeenCalledTimes(1);

    await act(async () => fixtures.chavesPix.resolve());
    expect(screen.queryByRole("heading", { name: "Tela de PIX" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Tela de contas" })).toBeTruthy();
    expect(animate).toHaveBeenCalledTimes(1);
  });
});
