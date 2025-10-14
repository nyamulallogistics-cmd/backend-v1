import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../dto/signup.dto';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
