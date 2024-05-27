import { DataTypes, Sequelize } from 'sequelize';

import { PagesModelDefined } from '../types/pages-model-defined';

function definePagesModel(sequelize: Sequelize): PagesModelDefined {
  return sequelize.define('pages', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    url: {
      type: DataTypes.STRING(2048),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metaDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastCrawledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    invalidatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    invalidationReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });
}

export { definePagesModel };
