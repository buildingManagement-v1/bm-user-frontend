export default defineAppConfig({
  ui: {
    colors: {
      primary: "blue",
      gray: "slate",
    },
    card: {
      variants: {
        variant: {
          outline: {
            root: "rounded-2xl ring ring-slate-200 shadow-[0px_10px_20px_-5px_rgba(0,0,0,0.04)]",
          },
        },
      },
    },
    button: {
      slots: {
        base: "rounded-lg",
      },
    },
    selectMenu: {
      slots: {
        content: "rounded-xl",
        base: "rounded-lg",
      },
    },
    dropdownMenu: {
      slots: {
        content: "rounded-xl",
      },
    },
    input: {
      slots: {
        base: "rounded-lg",
      },
    },
  },
});
