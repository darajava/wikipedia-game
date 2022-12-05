let xx = 100;

const x = () => {
  console.log(xx);
  setTimeout(() => {
    x();
  }, 100);
};

x();

xx = 10;
