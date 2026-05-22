<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * @var list<string>
     */
    private const PERMISSIONS = [
        'resources.manage',
        'reservations.create',
        'reservations.approve',
        'reservations.view-all',
        'audit.view',
    ];

    /**
     * @var array<string, list<string>>
     */
    private const ROLE_PERMISSIONS = [
        'super-admin' => self::PERMISSIONS,
        'admin' => [
            'resources.manage',
            'reservations.approve',
            'reservations.view-all',
            'audit.view',
        ],
        'manager' => [
            'reservations.approve',
            'reservations.create',
            'reservations.view-all',
        ],
        'requester' => [
            'reservations.create',
        ],
    ];

    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission);
        }

        foreach (self::ROLE_PERMISSIONS as $roleName => $permissions) {
            Role::findOrCreate($roleName)->syncPermissions($permissions);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
