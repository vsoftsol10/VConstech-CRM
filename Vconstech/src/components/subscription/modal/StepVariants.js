export const stepVariants = {
  enter: (dir) => ({
    opacity: 0,
    x: dir * 32,
  }),

  center: {
    opacity: 1,
    x: 0,
  },

  exit: (dir) => ({
    opacity: 0,
    x: -dir * 32,
  }),
};