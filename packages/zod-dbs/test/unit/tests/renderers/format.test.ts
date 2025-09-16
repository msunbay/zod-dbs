import type { ZodDbsTable } from 'zod-dbs-core';

import {
  formatEnumConstantName,
  formatEnumTypeName,
  formatObjectSchemaName,
  formatRecordTransformName,
  formatTableRecordName,
  formatTableSchemaName,
  getSchemaPrefix,
} from '../../../../src/renderers/format.js';

describe('format', () => {
  const createMockTable = (
    overrides: Partial<ZodDbsTable> = {}
  ): ZodDbsTable => ({
    type: 'table' as const,
    name: 'users',
    schemaName: 'public',
    columns: [],
    ...overrides,
  });

  describe('getSchemaPrefix', () => {
    it('should return "Table" for table type', () => {
      const table = createMockTable({ type: 'table', name: 'users' });
      const result = getSchemaPrefix(table);
      expect(result).toBe('Table');
    });

    it('should return "Table" for foreign_table type', () => {
      const table = createMockTable({
        type: 'foreign_table',
        name: 'external_data',
      });
      const result = getSchemaPrefix(table);
      expect(result).toBe('Table');
    });

    it('should return "Mv" for materialized_view type', () => {
      const table = createMockTable({
        type: 'materialized_view',
        name: 'user_stats',
      });
      const result = getSchemaPrefix(table);
      expect(result).toBe('Mv');
    });

    it('should return empty string for materialized_view with mv_ prefix', () => {
      const table = createMockTable({
        type: 'materialized_view',
        name: 'mv_user_stats',
      });
      const result = getSchemaPrefix(table);
      expect(result).toBe('');
    });

    it('should return empty string for materialized_view with mview_ prefix', () => {
      const table = createMockTable({
        type: 'materialized_view',
        name: 'mview_user_stats',
      });
      const result = getSchemaPrefix(table);
      expect(result).toBe('');
    });

    it('should return "View" for view type', () => {
      const table = createMockTable({
        type: 'view',
        name: 'user_summary',
      });
      const result = getSchemaPrefix(table);
      expect(result).toBe('View');
    });

    it('should return empty string for view with v_ prefix', () => {
      const table = createMockTable({
        type: 'view',
        name: 'v_user_summary',
      });
      const result = getSchemaPrefix(table);
      expect(result).toBe('');
    });

    it('should return empty string for view with view_ prefix', () => {
      const table = createMockTable({
        type: 'view',
        name: 'view_user_summary',
      });
      const result = getSchemaPrefix(table);
      expect(result).toBe('');
    });

    it('should return empty string for unknown type', () => {
      const table = createMockTable({
        type: 'unknown',
        name: 'unknown_object',
      });
      const result = getSchemaPrefix(table);
      expect(result).toBe('');
    });
  });

  describe('formatTableSchemaName', () => {
    it('should format read schema name for table with default PascalCase', () => {
      const table = createMockTable({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName({
        table,
        operation: 'read',
      });
      expect(result).toBe('UserPostsTableSchema');
    });

    it('should format insert schema name for table', () => {
      const table = createMockTable({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName({
        table,
        operation: 'insert',
      });
      expect(result).toBe('UserPostsTableInsertSchema');
    });

    it('should format update schema name for table', () => {
      const table = createMockTable({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName({
        table,
        operation: 'update',
      });
      expect(result).toBe('UserPostsTableUpdateSchema');
    });

    it('should format write schema name for table', () => {
      const table = createMockTable({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName({ table, operation: 'write' });
      expect(result).toBe('UserPostsTableWriteSchema');
    });

    it('should format schema name for view', () => {
      const table = createMockTable({
        type: 'view',
        name: 'user_summary',
      });
      const result = formatTableSchemaName({
        table,
        operation: 'read',
      });
      expect(result).toBe('UserSummaryViewSchema');
    });

    it('should format schema name for view with prefix', () => {
      const table = createMockTable({
        type: 'view',
        name: 'v_user_summary',
      });
      const result = formatTableSchemaName({
        table,
        operation: 'read',
      });
      expect(result).toBe('VUserSummarySchema');
    });

    it('should format schema name for materialized view', () => {
      const table = createMockTable({
        type: 'materialized_view',
        name: 'user_stats',
      });
      const result = formatTableSchemaName({
        table,
        operation: 'read',
      });
      expect(result).toBe('UserStatsMvSchema');
    });

    it('should format schema name for materialized view with prefix', () => {
      const table = createMockTable({
        type: 'materialized_view',
        name: 'mv_user_stats',
      });
      const result = formatTableSchemaName({
        table,
        operation: 'read',
      });
      expect(result).toBe('MvUserStatsSchema');
    });

    it('should respect camelCase casing', () => {
      const table = createMockTable({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName({
        table,
        operation: 'read',
        casing: 'camelCase',
      });
      expect(result).toBe('userPostsTableSchema');
    });

    it('should respect snake_case casing', () => {
      const table = createMockTable({
        type: 'table',
        name: 'UserPosts',
      });
      const result = formatTableSchemaName({
        table,
        operation: 'read',
        casing: 'snake_case',
      });
      expect(result).toBe('user_posts_table_schema');
    });
  });

  describe('formatTableRecordName', () => {
    it('should format read record name with default PascalCase', () => {
      const table = createMockTable({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName({ table, operation: 'read' });
      expect(result).toBe('UserPostRecord');
    });

    it('should format insert record name', () => {
      const table = createMockTable({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName({ table, operation: 'insert' });
      expect(result).toBe('UserPostInsertRecord');
    });

    it('should format update record name', () => {
      const table = createMockTable({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName({ table, operation: 'update' });
      expect(result).toBe('UserPostUpdateRecord');
    });

    it('should singularize plural table names', () => {
      const table = createMockTable({ type: 'table', name: 'users' });
      const result = formatTableRecordName({ table, operation: 'read' });
      expect(result).toBe('UserRecord');
    });

    it('should handle already singular table names', () => {
      const table = createMockTable({
        type: 'table',
        name: 'user_profile',
      });
      const result = formatTableRecordName({ table, operation: 'read' });
      expect(result).toBe('UserProfileRecord');
    });

    it('should respect camelCase casing', () => {
      const table = createMockTable({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName({
        table,
        operation: 'read',
        casing: 'camelCase',
      });
      expect(result).toBe('userPostRecord');
    });

    it('should respect snake_case casing', () => {
      const table = createMockTable({
        type: 'table',
        name: 'UserPosts',
      });
      const result = formatTableRecordName({
        table,
        operation: 'read',
        casing: 'snake_case',
      });
      expect(result).toBe('user_post_record');
    });

    it('should handle complex plural forms', () => {
      const table = createMockTable({
        type: 'table',
        name: 'categories',
      });
      const result = formatTableRecordName({ table, operation: 'read' });
      expect(result).toBe('CategoryRecord');
    });

    it('should format write record name with write operation suffix', () => {
      const table = createMockTable({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName({ table, operation: 'write' });
      expect(result).toBe('UserPostWriteRecord');
    });
  });

  describe('formatRecordTransformName', () => {
    it('should format read transform name (singularized) with default casing', () => {
      const table = createMockTable({ name: 'user_posts' });
      const result = formatRecordTransformName({
        table,
        operation: 'read',
      });
      expect(result).toBe('transformUserPostBaseRecord');
    });

    it('should format insert transform name', () => {
      const table = createMockTable({ name: 'users' });
      const result = formatRecordTransformName({
        table,
        operation: 'insert',
      });
      expect(result).toBe('transformUserInsertBaseRecord');
    });

    it('should format update transform name with PascalCase table already singular', () => {
      const table = createMockTable({ name: 'user_profile' });
      const result = formatRecordTransformName({
        table,
        operation: 'update',
      });
      expect(result).toBe('transformUserProfileUpdateBaseRecord');
    });

    it('should format write transform name', () => {
      const table = createMockTable({ name: 'user_profiles' });
      const result = formatRecordTransformName({
        table,
        operation: 'write',
      });
      expect(result).toBe('transformUserProfileWriteBaseRecord');
    });

    it('should respect camelCase casing', () => {
      const table = createMockTable({ name: 'user_profiles' });
      const result = formatRecordTransformName({
        table,
        operation: 'read',
        casing: 'camelCase',
      });
      expect(result).toBe('transformUserProfileBaseRecord'); // first letter already lower due to camelCase
    });

    it('should respect snake_case casing', () => {
      const table = createMockTable({ name: 'user_profiles' });
      const result = formatRecordTransformName({
        table,
        operation: 'insert',
        casing: 'snake_case',
      });
      expect(result).toBe('transform_user_profile_insert_base_record');
    });

    it('should disable singularization when singularize=false', () => {
      const table = createMockTable({ name: 'user_profiles' });
      const result = formatRecordTransformName({
        table,
        operation: 'read',
        singularize: false,
      });
      expect(result).toBe('transformUserProfilesBaseRecord');
    });

    it('should apply custom suffix', () => {
      const table = createMockTable({ name: 'users' });
      const result = formatRecordTransformName({
        table,
        operation: 'read',
        suffix: 'XYZ',
      });
      expect(result).toBe('transformUserXYZ');
    });
  });

  describe('formatJsonSchemaName', () => {
    it('should format JSON schema name with default PascalCase', () => {
      const result = formatObjectSchemaName({
        tableName: 'user_posts',
        columnName: 'metadata',
      });
      expect(result).toBe('UserPostMetadataSchema');
    });

    it('should handle plural table names by singularizing', () => {
      const result = formatObjectSchemaName({
        tableName: 'users',
        columnName: 'preferences',
      });
      expect(result).toBe('UserPreferencesSchema');
    });

    it('should handle camelCase column names', () => {
      const result = formatObjectSchemaName({
        tableName: 'users',
        columnName: 'userPreferences',
      });
      expect(result).toBe('UserUserPreferencesSchema');
    });

    it('should respect camelCase casing', () => {
      const result = formatObjectSchemaName({
        tableName: 'user_posts',
        columnName: 'metadata',
        casing: 'camelCase',
      });
      expect(result).toBe('userPostMetadataSchema');
    });

    it('should respect snake_case casing', () => {
      const result = formatObjectSchemaName({
        tableName: 'UserPosts',
        columnName: 'MetaData',
        casing: 'snake_case',
      });
      expect(result).toBe('user_post_meta_data_schema');
    });

    it('should handle complex table and column names', () => {
      const result = formatObjectSchemaName({
        tableName: 'user_account_settings',
        columnName: 'notification_preferences',
      });
      expect(result).toBe('UserAccountSettingNotificationPreferencesSchema');
    });
  });

  describe('formatEnumConstantName', () => {
    it('should format enum constant name in UPPER_SNAKE_CASE', () => {
      const result = formatEnumConstantName({
        tableName: 'users',
        colName: 'status',
      });
      expect(result).toBe('USER_STATUSES');
    });

    it('should handle plural table names by singularizing then pluralizing', () => {
      const result = formatEnumConstantName({
        tableName: 'user_posts',
        colName: 'category',
      });
      expect(result).toBe('USER_POST_CATEGORIES');
    });

    it('should handle camelCase column names', () => {
      const result = formatEnumConstantName({
        tableName: 'users',
        colName: 'accountType',
      });
      expect(result).toBe('USER_ACCOUNT_TYPES');
    });

    it('should handle PascalCase column names', () => {
      const result = formatEnumConstantName({
        tableName: 'users',
        colName: 'AccountType',
      });
      expect(result).toBe('USER_ACCOUNT_TYPES');
    });

    it('should handle snake_case table names', () => {
      const result = formatEnumConstantName({
        tableName: 'user_account_settings',
        colName: 'notification_type',
      });
      expect(result).toBe('USER_ACCOUNT_SETTING_NOTIFICATION_TYPES');
    });

    it('should handle kebab-case inputs', () => {
      const result = formatEnumConstantName({
        tableName: 'user-posts',
        colName: 'post-status',
      });
      expect(result).toBe('USER_POST_POST_STATUSES');
    });

    it('should handle single character names', () => {
      const result = formatEnumConstantName({ tableName: 'a', colName: 'b' });
      expect(result).toBe('A_BS');
    });

    it('should handle special pluralization cases', () => {
      const result = formatEnumConstantName({
        tableName: 'categories',
        colName: 'type',
      });
      expect(result).toBe('CATEGORY_TYPES');
    });
  });

  describe('formatEnumTypeName', () => {
    it('should format enum type name with default PascalCase', () => {
      const result = formatEnumTypeName({
        tableName: 'users',
        colName: 'status',
      });
      expect(result).toBe('UserStatus');
    });

    it('should handle plural table names by singularizing', () => {
      const result = formatEnumTypeName({
        tableName: 'user_posts',
        colName: 'category',
      });
      expect(result).toBe('UserPostCategory');
    });

    it('should handle camelCase column names', () => {
      const result = formatEnumTypeName({
        tableName: 'users',
        colName: 'accountType',
      });
      expect(result).toBe('UserAccountType');
    });

    it('should handle PascalCase column names', () => {
      const result = formatEnumTypeName({
        tableName: 'users',
        colName: 'AccountType',
      });
      expect(result).toBe('UserAccountType');
    });

    it('should respect camelCase casing', () => {
      const result = formatEnumTypeName({
        tableName: 'users',
        colName: 'status',
        casing: 'camelCase',
      });
      expect(result).toBe('userStatus');
    });

    it('should respect snake_case casing', () => {
      const result = formatEnumTypeName({
        tableName: 'Users',
        colName: 'Status',
        casing: 'snake_case',
      });
      expect(result).toBe('user_status');
    });

    it('should handle complex table and column names', () => {
      const result = formatEnumTypeName({
        tableName: 'user_account_settings',
        colName: 'notification_type',
      });
      expect(result).toBe('UserAccountSettingNotificationType');
    });

    it('should handle special characters in names', () => {
      const result = formatEnumTypeName({
        tableName: 'user_2fa_settings',
        colName: 'auth_method',
      });
      expect(result).toBe('User2faSettingAuthMethod');
    });
  });

  describe('edge cases and combinations', () => {
    it('should handle empty string table names gracefully', () => {
      const result = formatEnumConstantName({
        tableName: '',
        colName: 'status',
      });
      expect(result).toBe('_STATUSES');
    });

    it('should handle empty string column names gracefully', () => {
      const result = formatEnumConstantName({
        tableName: 'users',
        colName: '',
      });
      expect(result).toBe('USER_s');
    });

    it('should handle very long names', () => {
      const longTableName = 'very_long_table_name_that_exceeds_normal_length';
      const longColumnName =
        'very_long_column_name_that_also_exceeds_normal_length';
      const result = formatEnumConstantName({
        tableName: longTableName,
        colName: longColumnName,
      });
      expect(result).toBe(
        'VERY_LONG_TABLE_NAME_THAT_EXCEED_NORMAL_LENGTH_VERY_LONG_COLUMN_NAME_THAT_ALSO_EXCEEDS_NORMAL_LENGTHS'
      );
    });

    it('should handle names with numbers', () => {
      const result = formatEnumTypeName({
        tableName: 'table_v2',
        colName: 'status_2fa',
      });
      expect(result).toBe('TableV2Status2fa');
    });

    it('should handle names with underscores only', () => {
      const result = formatObjectSchemaName({
        tableName: '_',
        columnName: '_',
      });
      expect(result).toBe('Schema');
    });
  });
});
