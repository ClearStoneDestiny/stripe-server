import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BasicModel {
  @Field(() => String, { nullable: true })
  message?: string;
}
