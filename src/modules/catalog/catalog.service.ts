import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubscriptionPlanDto } from '@catalog/dto/create-subscription-plan.dto';
import { StripeProduct } from '@stripe/entities/stripe-product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '@catalog/entities/subscription-plan.entity';
import { SubscriptionPlanPrice } from '@catalog/entities/subscription-plan-price.entity';
import { StripePrice } from '@stripe/entities/stripe-price.entity';
import { CreateSubscriptionPlanPriceDto } from '@catalog/dto/create-subscription-plan-price.dto';
import { CreateGameDto } from '@catalog/dto/create-game.dto';
import { SubscriptionPlanKindEnum } from '@catalog/enums/subscription-plan-kind.enum';
import { Game } from '@catalog/entities/game.entity';
import { UpdateGamePlanDto } from '@catalog/dto/update-game-plan.dto';
import { GetGamesDto } from '@catalog/dto/get-games.dto';
import { SubscriptionPlanCodeEnum } from '@catalog/enums/subscription-plan-code.enum';
import { GetGamesResponseDto } from '@catalog/dto/get-games-response.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlansRepository: Repository<SubscriptionPlan>,

    @InjectRepository(SubscriptionPlanPrice)
    private readonly subscriptionPlanPricesRepository: Repository<SubscriptionPlanPrice>,

    @InjectRepository(Game)
    private readonly gamesRepository: Repository<Game>,

    @InjectRepository(StripeProduct)
    private readonly stripeProductsRepository: Repository<StripeProduct>,

    @InjectRepository(StripePrice)
    private readonly stripePricesRepository: Repository<StripePrice>,
  ) {}

  async createSubscriptionPlan(dto: CreateSubscriptionPlanDto) {
    let stripeProduct: StripeProduct | null = null;

    if (dto.stripeProductId) {
      stripeProduct = await this.stripeProductsRepository.findOne({
        where: {
          id: dto.stripeProductId,
        },
      });

      if (!stripeProduct) {
        throw new NotFoundException('Stripe product not found');
      }
    }

    const plan = this.subscriptionPlansRepository.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      kind: dto.kind,
      sortOrder: dto.sortOrder ?? 0,
      active: true,
      stripeProduct: stripeProduct ?? undefined,
    });

    return this.subscriptionPlansRepository.save(plan);
  }

  async createSubscriptionPlanPrice(dto: CreateSubscriptionPlanPriceDto) {
    const plan = await this.subscriptionPlansRepository.findOne({
      where: {
        id: dto.planId,
      },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const stripePrice = await this.stripePricesRepository.findOne({
      where: {
        id: dto.stripePriceId,
      },
    });

    if (!stripePrice) {
      throw new NotFoundException('Stripe price not found');
    }

    const planPrice = this.subscriptionPlanPricesRepository.create({
      label: dto.label,
      billingInterval: dto.billingInterval ?? stripePrice.interval,

      isDefault: dto.isDefault ?? false,

      sortOrder: dto.sortOrder ?? 0,

      active: true,

      plan,
      stripePrice,
    });

    return this.subscriptionPlanPricesRepository.save(planPrice);
  }

  async createGame(dto: CreateGameDto) {
    let requiredPlan: SubscriptionPlan | null = null;

    if (dto.requiredPlanId) {
      requiredPlan = await this.subscriptionPlansRepository.findOne({
        where: {
          id: dto.requiredPlanId,
        },
      });

      if (!requiredPlan) {
        throw new NotFoundException('Subscription plan not found');
      }

      if (requiredPlan.kind !== SubscriptionPlanKindEnum.TIERED) {
        throw new BadRequestException('Game required plan must be tiered');
      }
    }

    const game = this.gamesRepository.create({
      slug: dto.slug,
      title: dto.title,
      shortDescription: dto.shortDescription,
      description: dto.description,
      coverImageUrl: dto.coverImageUrl,
      heroImageUrl: dto.heroImageUrl,
      sortOrder: dto.sortOrder ?? 0,
      active: dto.active ?? true,
      requiredPlan: requiredPlan ?? undefined,
    });

    return this.gamesRepository.save(game);
  }

  async updateGameRequiredPlan(gameId: number, dto: UpdateGamePlanDto) {
    const game = await this.gamesRepository.findOne({
      where: {
        id: gameId,
      },

      relations: {
        requiredPlan: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    /**
     * Remove required plan
     */
    if (dto.requiredPlanId === null) {
      game.requiredPlan = undefined;
      return this.gamesRepository.save(game);
    }

    if (dto.requiredPlanId) {
      const requiredPlan = await this.subscriptionPlansRepository.findOne({
        where: {
          id: dto.requiredPlanId,
        },
      });

      if (!requiredPlan) {
        throw new NotFoundException('Subscription plan not found');
      }

      if (requiredPlan.kind !== SubscriptionPlanKindEnum.TIERED) {
        throw new BadRequestException('Required plan must be tiered');
      }

      game.requiredPlan = requiredPlan;
    }

    return this.gamesRepository.save(game);
  }

  async getGames(query: GetGamesDto): Promise<GetGamesResponseDto> {
    const { page = 1, limit = 10, planCode } = query;

    const qb = this.gamesRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.requiredPlan', 'requiredPlan')
      .where('game.active = :active', {
        active: true,
      });

    /**
     * Filter by accessible subscription plan
     */
    if (planCode) {
      const selectedPlan = await this.subscriptionPlansRepository.findOne({
        where: {
          code: planCode as SubscriptionPlanCodeEnum,
        },
      });

      if (!selectedPlan) {
        throw new NotFoundException('Subscription plan not found');
      }

      if (selectedPlan.kind !== SubscriptionPlanKindEnum.TIERED) {
        throw new BadRequestException('Plan must be tiered');
      }

      qb.andWhere(
        `
      (
        requiredPlan.id IS NULL
        OR requiredPlan.sortOrder <= :sortOrder
      )
      `,
        {
          sortOrder: selectedPlan.sortOrder,
        },
      );
    }
    qb.orderBy('game.sortOrder', 'ASC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((game) => ({
        id: game.id,
        slug: game.slug,
        title: game.title,
        coverImageUrl: game.coverImageUrl,
        shortDescription: game.shortDescription,
      })),

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
