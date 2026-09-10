import { app } from "./app.js";
app.listen(Number(process.env.PORT || 5000), () =>
  console.log(`FindIt API listening on ${process.env.PORT || 5000}`),
);
