import { UserRole } from '../dto/signup.dto';

export class User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  phoneNumber: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
