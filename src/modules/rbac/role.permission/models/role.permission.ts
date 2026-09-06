import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RoleModel } from '../../role/models/role.model';
import { PermissionModel } from '../../permission/modals/permission.model';

@Entity('role_permissions')
export class RolePermissionModel {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RoleModel)
  @JoinColumn({ name: 'roleId', referencedColumnName: 'roleId' })
  role: RoleModel;

  @ManyToOne(() => PermissionModel)
  @JoinColumn({ name: 'permissionId', referencedColumnName: 'permissionId' })
  permission: PermissionModel;
}
