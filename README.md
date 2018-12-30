# bring-api

```javascript
import { BringApi } from "@schirkan/bring-api";

const options = { username: "your@mail", password: "secret" };
const bring = new BringApi(options);
const list = await bring.getDefaultList();
console.debug(list.items);
```
