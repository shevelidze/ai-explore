import { ModelDefined } from "sequelize";
import {
  PagesModalCreationAttributes,
  PagesModelAttributes,
} from "./pages-model-attributes";

type PagesModelDefined = ModelDefined<
  PagesModelAttributes,
  PagesModalCreationAttributes
>;

export type { PagesModelDefined };
