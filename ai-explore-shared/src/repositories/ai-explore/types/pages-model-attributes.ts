import { Optional } from 'sequelize';

interface PagesModelAttributes {
  id: number;
  url: string;
  title: string | null;
  metaDescription: string | null;
  lastCrawledAt: Date | null;
  createdAt: Date;
  invalidatedAt: Date | null;
  invalidationReason: string | null;
}

type PagesModalCreationAttributes = Optional<
  PagesModelAttributes,
  | 'id'
  | 'createdAt'
  | 'title'
  | 'metaDescription'
  | 'lastCrawledAt'
  | 'invalidatedAt'
  | 'invalidationReason'
>;

export type { PagesModelAttributes, PagesModalCreationAttributes };
