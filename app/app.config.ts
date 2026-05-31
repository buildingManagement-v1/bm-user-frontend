export default defineAppConfig({
  ui: {
    colors: {
      primary: "blue",
      gray: "zinc",
    },
    card: {
      variants: {
        variant: {
          outline: {
            root: "rounded-2xl ring-1 ring-zinc-200/80 dark:ring-zinc-700/50 shadow-sm bg-white dark:bg-zinc-900",
          },
          elevated: {
            root: "rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.25)] bg-white dark:bg-zinc-900",
          },
        },
      },
    },
    button: {
      slots: {
        base: "rounded-xl font-medium",
      },
    },
    badge: {
      slots: {
        base: "rounded-lg",
      },
    },
    selectMenu: {
      slots: {
        content:
          "rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] ",
        base: "rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)] bg-white dark:bg-zinc-900 min-w-0",
      },
    },
    dropdownMenu: {
      slots: {
        content: "rounded-xl",
      },
    },
    input: {
      slots: {
        base: "rounded-xl",
      },
    },
  },
});
