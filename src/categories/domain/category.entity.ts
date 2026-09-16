/**
 * Domain entity — mirrors the Prisma Category model but lives in the domain
 * layer. Services and the repository interface work with this type only;
 * they never import Prisma directly.
 */
export interface CategoryEntity {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CreateCategoryDto {
  name: string;
}

export interface UpdateCategoryDto {
  name?: string;
}
