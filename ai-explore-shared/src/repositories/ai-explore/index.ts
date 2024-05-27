import { Op, Sequelize } from 'sequelize';
import { definePagesModel } from './models/define-pages-model';
import type { PagesModelDefined } from './types/pages-model-defined';
import { RECRAWLING_PERIOD_DAYS } from './constants/recrawling-period-days';

class AiExploreRepository {
  constructor(databaseUrl: string, logging: boolean = false) {
    this.sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging,
    });

    this.pagesModel = definePagesModel(this.sequelize);
  }

  public async connect() {
    await this.sequelize.authenticate();
    await this.pagesModel.sync({
      alter: true,
    });
  }

  public async disconnect() {
    await this.sequelize.close();
  }

  public getPagesThatNeedToBeCrawled(limit?: number) {
    return this.pagesModel.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { lastCrawledAt: null },
              {
                lastCrawledAt: {
                  [Op.lte]: this.getRecrawlingThresholdDate(),
                },
              },
            ],
          },
          { invalidatedAt: null },
        ],
      },
      order: [
        ['lastCrawledAt', 'ASC NULLS FIRST'],
        ['createdAt', 'ASC'],
      ],
      limit,
    });
  }

  public async markPageAsCrawled(
    url: string,
    data: {
      title?: string;
      metaDescription?: string;
    }
  ) {
    await this.pagesModel.update(
      {
        lastCrawledAt: new Date(),
        metaDescription: data.metaDescription,
        title: data.title,
      },
      { where: { url } }
    );
  }

  public async markPageAsInvalid(url: string, reason: string = 'Unknown') {
    await this.pagesModel.update(
      {
        invalidatedAt: new Date(),
        invalidationReason: reason,
      },
      { where: { url } }
    );
  }

  public async addSeedPages() {
    await this.pagesModel.bulkCreate([
      {
        url: 'https://csc.knu.ua/uk/',
      },
    ]);
  }

  public async addPages(urls: string[]) {
    await this.pagesModel.bulkCreate(
      urls.map((url) => ({ url })),
      {
        ignoreDuplicates: true,
      }
    );
  }

  public getPage(pageId: number) {
    return this.pagesModel.findByPk(pageId);
  }

  private getRecrawlingThresholdDate() {
    const now = new Date();
    const recrawlingThresholdDate = new Date(now);
    recrawlingThresholdDate.setDate(now.getDate() - RECRAWLING_PERIOD_DAYS);
    return recrawlingThresholdDate;
  }

  private sequelize: Sequelize;
  private pagesModel: PagesModelDefined;
}

export { AiExploreRepository };
