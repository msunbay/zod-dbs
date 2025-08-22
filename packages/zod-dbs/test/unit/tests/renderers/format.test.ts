import { ZodDbsTableInfo } from 'zod-dbs-core';

import {
  formatEnumConstantName,
  formatEnumTypeName,
  formatJsonSchemaName,
  formatRecordTransformName,
  formatTableRecordName,
  formatTableSchemaName,
  getSchemaPrefix,
} from '../../../../src/renderers/format.js';

describe('format', () => {
  // Helper function to create a mock ZodDbsTableInfo
  const createMockTableInfo = (
    overrides: Partial<ZodDbsTableInfo> = {}
  ): ZodDbsTableInfo => ({
    type: 'table' as const,
    name: 'users',
    schemaName: 'public',
    columns: [],
    ...overrides,
  });

  describe('getSchemaPrefix', () => {
    it('should return "Table" for table type', () => {
      const tableInfo = createMockTableInfo({ type: 'table', name: 'users' });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('Table');
    });

    it('should return "Table" for foreign_table type', () => {
      const tableInfo = createMockTableInfo({
        type: 'foreign_table',
        name: 'external_data',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('Table');
    });

    it('should return "Mv" for materialized_view type', () => {
      const tableInfo = createMockTableInfo({
        type: 'materialized_view',
        name: 'user_stats',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('Mv');
    });

    it('should return empty string for materialized_view with mv_ prefix', () => {
      const tableInfo = createMockTableInfo({
        type: 'materialized_view',
        name: 'mv_user_stats',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('');
    });

    it('should return empty string for materialized_view with mview_ prefix', () => {
      const tableInfo = createMockTableInfo({
        type: 'materialized_view',
        name: 'mview_user_stats',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('');
    });

    it('should return "View" for view type', () => {
      const tableInfo = createMockTableInfo({
        type: 'view',
        name: 'user_summary',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('View');
    });

    it('should return empty string for view with v_ prefix', () => {
      const tableInfo = createMockTableInfo({
        type: 'view',
        name: 'v_user_summary',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('');
    });

    it('should return empty string for view with view_ prefix', () => {
      const tableInfo = createMockTableInfo({
        type: 'view',
        name: 'view_user_summary',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('');
    });

    it('should return empty string for unknown type', () => {
      const tableInfo = createMockTableInfo({
        type: 'unknown',
        name: 'unknown_object',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('');
    });
  });

  describe('formatTableSchemaName', () => {
    it('should format read schema name for table with default PascalCase', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName({
        tableInfo,
        operation: 'read',
      });
      expect(result).toBe('UserPostsTableSchema');
    });

    it('should format insert schema name for table', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName({
        tableInfo,
        operation: 'insert',
      });
      expect(result).toBe('UserPostsTableInsertSchema');
    });

    it('should format update schema name for table', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName({
        tableInfo,
        operation: 'update',
      });
      expect(result).toBe('UserPostsTableUpdateSchema');
    });

    it('should format write schema name for table', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName({ tableInfo, operation: 'write' });
      expect(result).toBe('UserPostsTableWriteSchema');
    });

    it('should format schema name for view', () => {
      const tableInfo = createMockTableInfo({
        type: 'view',
        name: 'user_summary',
      });
      const result = formatTableSchemaName({
        tableInfo,
        operation: 'read',
      });
      expect(result).toBe('UserSummaryViewSchema');
    });

    it('should format schema name for view with prefix', () => {
      const tableInfo = createMockTableInfo({
        type: 'view',
        name: 'v_user_summary',
      });
      const result = formatTableSchemaName({
        tableInfo,
        operation: 'read',
      });
      expect(result).toBe('VUserSummarySchema');
    });

    it('should format schema name for materialized view', () => {
      const tableInfo = createMockTableInfo({
        type: 'materialized_view',
        name: 'user_stats',
      });
      const result = formatTableSchemaName({
        tableInfo,
        operation: 'read',
      });
      expect(result).toBe('UserStatsMvSchema');
    });

    it('should format schema name for materialized view with prefix', () => {
      const tableInfo = createMockTableInfo({
        type: 'materialized_view',
        name: 'mv_user_stats',
      });
      const result = formatTableSchemaName({
        tableInfo,
        operation: 'read',
      });
      expect(result).toBe('MvUserStatsSchema');
    });

    it('should respect camelCase casing', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName({
        tableInfo,
        operation: 'read',
        casing: 'camelCase',
      });
      expect(result).toBe('userPostsTableSchema');
    });

    it('should respect snake_case casing', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'UserPosts',
      });
      const result = formatTableSchemaName({
        tableInfo,
        operation: 'read',
        casing: 'snake_case',
      });
      expect(result).toBe('user_posts_table_schema');
    });
  });

  describe('formatTableRecordName', () => {
    it('should format read record name with default PascalCase', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName({ tableInfo, operation: 'read' });
      expect(result).toBe('UserPostRecord');
    });

    it('should format insert record name', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName({ tableInfo, operation: 'insert' });
      expect(result).toBe('UserPostInsertRecord');
    });

    it('should format update record name', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName({ tableInfo, operation: 'update' });
      expect(result).toBe('UserPostUpdateRecord');
    });

    it('should singularize plural table names', () => {
      const tableInfo = createMockTableInfo({ type: 'table', name: 'users' });
      const result = formatTableRecordName({ tableInfo, operation: 'read' });
      expect(result).toBe('UserRecord');
    });

    it('should handle already singular table names', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_profile',
      });
      const result = formatTableRecordName({ tableInfo, operation: 'read' });
      expect(result).toBe('UserProfileRecord');
    });

    it('should respect camelCase casing', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName({
        tableInfo,
        operation: 'read',
        casing: 'camelCase',
      });
      expect(result).toBe('userPostRecord');
    });

    it('should respect snake_case casing', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'UserPosts',
      });
      const result = formatTableRecordName({
        tableInfo,
        operation: 'read',
        casing: 'snake_case',
      });
      expect(result).toBe('user_post_record');
    });

    it('should handle complex plural forms', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'categories',
      });
      const result = formatTableRecordName({ tableInfo, operation: 'read' });
      expect(result).toBe('CategoryRecord');
    });

    it('should format write record name with write operation suffix', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName({ tableInfo, operation: 'write' });
      expect(result).toBe('UserPostWriteRecord');
    });
  });

  describe('formatRecordTransformName', () => {
    it('should format read transform name (singularized) with default casing', () => {
      const tableInfo = createMockTableInfo({ name: 'user_posts' });
      const result = formatRecordTransformName({
        tableInfo,
        operation: 'read',
      });
      expect(result).toBe('transformUserPostBaseRecord');
    });

    it('should format insert transform name', () => {
      const tableInfo = createMockTableInfo({ name: 'users' });
      const result = formatRecordTransformName({
        tableInfo,
        operation: 'insert',
      });
      expect(result).toBe('transformUserInsertBaseRecord');
    });

    it('should format update transform name with PascalCase table already singular', () => {
      const tableInfo = createMockTableInfo({ name: 'user_profile' });
      const result = formatRecordTransformName({
        tableInfo,
        operation: 'update',
      });
      expect(result).toBe('transformUserProfileUpdateBaseRecord');
    });

    it('should format write transform name', () => {
      const tableInfo = createMockTableInfo({ name: 'user_profiles' });
      const result = formatRecordTransformName({
        tableInfo,
        operation: 'write',
      });
      expect(result).toBe('transformUserProfileWriteBaseRecord');
    });

    it('should respect camelCase casing', () => {
      const tableInfo = createMockTableInfo({ name: 'user_profiles' });
      const result = formatRecordTransformName({
        tableInfo,
        operation: 'read',
        casing: 'camelCase',
      });
      expect(result).toBe('transformUserProfileBaseRecord'); // first letter already lower due to camelCase
    });

    it('should respect snake_case casing', () => {
      const tableInfo = createMockTableInfo({ name: 'user_profiles' });
      const result = formatRecordTransformName({
        tableInfo,
        operation: 'insert',
        casing: 'snake_case',
      });
      expect(result).toBe('transform_user_profile_insert_base_record');
    });

    it('should disable singularization when singularize=false', () => {
      const tableInfo = createMockTableInfo({ name: 'user_profiles' });
      const result = formatRecordTransformName({
        tableInfo,
        operation: 'read',
        singularize: false,
      });
      expect(result).toBe('transformUserProfilesBaseRecord');
    });

    it('should apply custom suffix', () => {
      const tableInfo = createMockTableInfo({ name: 'users' });
      const result = formatRecordTransformName({
        tableInfo,
        operation: 'read',
        suffix: 'XYZ',
      });
      expect(result).toBe('transformUserXYZ');
    });
  });

  describe('formatJsonSchemaName', () => {
    it('should format JSON schema name with default PascalCase', () => {
      const result = formatJsonSchemaName({
        tableName: 'user_posts',
        columnName: 'metadata',
      });
      expect(result).toBe('UserPostMetadataSchema');
    });

    it('should handle plural table names by singularizing', () => {
      const result = formatJsonSchemaName({
        tableName: 'users',
        columnName: 'preferences',
      });
      expect(result).toBe('UserPreferencesSchema');
    });

    it('should handle camelCase column names', () => {
      const result = formatJsonSchemaName({
        tableName: 'users',
        columnName: 'userPreferences',
      });
      expect(result).toBe('UserUserPreferencesSchema');
    });

    it('should respect camelCase casing', () => {
      const result = formatJsonSchemaName({
        tableName: 'user_posts',
        columnName: 'metadata',
        casing: 'camelCase',
      });
      expect(result).toBe('userPostMetadataSchema');
    });

    it('should respect snake_case casing', () => {
      const result = formatJsonSchemaName({
        tableName: 'UserPosts',
        columnName: 'MetaData',
        casing: 'snake_case',
      });
      expect(result).toBe('user_post_meta_data_schema');
    });

    it('should handle complex table and column names', () => {
      const result = formatJsonSchemaName({
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
      const result = formatJsonSchemaName({ tableName: '_', columnName: '_' });
      expect(result).toBe('Schema');
    });
  });
});
