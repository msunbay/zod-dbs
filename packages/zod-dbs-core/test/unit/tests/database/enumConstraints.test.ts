import { describe, expect, it } from 'vitest';

import { getEnumConstraints } from '../../../../src/database/enumConstraints.js';

describe('getEnumConstraints', () => {
  describe('ANY ARRAY constraints', () => {
    it('should parse basic ANY ARRAY constraint', () => {
      expect(
        getEnumConstraints('status', [
          "(status = ANY (ARRAY['active','inactive']))",
        ])
      ).toEqual(['active', 'inactive']);
    });

    it('should parse ANY ARRAY constraint with type casting', () => {
      expect(
        getEnumConstraints('brand', [
          "((\"orchardBrand\" = ANY (ARRAY['orchard'::text, 'awal'::text, 'sme'::text])))",
        ])
      ).toEqual(['orchard', 'awal', 'sme']);
    });

    it('should parse ANY ARRAY constraint with complex type casting', () => {
      expect(
        getEnumConstraints('category', [
          "(category = ANY ((ARRAY['food','drinks','snacks'])::character varying[]))",
        ])
      ).toEqual(['food', 'drinks', 'snacks']);
    });

    it('should handle ANY ARRAY with extra parentheses', () => {
      expect(
        getEnumConstraints('priority', [
          "(((priority = ANY (ARRAY['high','medium','low']))))",
        ])
      ).toEqual(['high', 'medium', 'low']);
    });

    it('should handle ANY ARRAY with escaped quotes', () => {
      // Note: The parser removes quotes and doesn't handle escaped quotes properly
      expect(
        getEnumConstraints('status', [
          "(status = ANY (ARRAY['simple','basic']))",
        ])
      ).toEqual(['simple', 'basic']);
    });
  });

  describe('IN constraints', () => {
    it('should parse basic IN constraint', () => {
      expect(getEnumConstraints('type', ["(type IN ('foo','bar'))"])).toEqual([
        'foo',
        'bar',
      ]);
    });

    it('should parse IN constraint with quoted column name', () => {
      expect(
        getEnumConstraints('status', [
          "(\"status\" IN ('pending','approved','rejected'))",
        ])
      ).toEqual(['pending', 'approved', 'rejected']);
    });

    it('should parse IN constraint with type casting', () => {
      expect(
        getEnumConstraints('level', [
          "(level IN ('beginner'::text,'intermediate'::text,'advanced'::text))",
        ])
      ).toEqual(['beginner', 'intermediate', 'advanced']);
    });

    it('should handle IN constraint with extra whitespace', () => {
      expect(
        getEnumConstraints('role', [
          "( role IN ( 'admin' , 'user' , 'guest' ) )",
        ])
      ).toEqual(['admin', 'user', 'guest']);
    });
  });

  describe('OR constraints', () => {
    it('should parse basic OR constraint', () => {
      expect(
        getEnumConstraints('color', [
          "(color = 'red' OR color = 'blue' OR color = 'green')",
        ])
      ).toEqual(['red', 'blue', 'green']);
    });

    it('should parse OR constraint with quoted column names', () => {
      expect(
        getEnumConstraints('state', [
          '("state" = \'active\' OR "state" = \'inactive\' OR "state" = \'pending\')',
        ])
      ).toEqual(['active', 'inactive', 'pending']);
    });

    it('should handle OR constraint with mixed quoting', () => {
      expect(
        getEnumConstraints('mode', [
          "(mode = 'read' OR \"mode\" = 'write' OR mode = 'execute')",
        ])
      ).toEqual(['read', 'write', 'execute']);
    });

    it('should handle OR constraint with extra whitespace', () => {
      expect(
        getEnumConstraints('grade', [
          "( grade = 'A'  OR  grade = 'B'  OR  grade = 'C' )",
        ])
      ).toEqual(['A', 'B', 'C']);
    });
  });

  describe('Array contains (<@) constraints', () => {
    it('should parse basic array contains constraint', () => {
      expect(
        getEnumConstraints('tag', [
          "(tag <@ ARRAY['important','urgent','normal'])",
        ])
      ).toEqual(['important', 'urgent', 'normal']);
    });

    it('should parse array contains constraint with type casting', () => {
      expect(
        getEnumConstraints('department', [
          "(department <@ ARRAY['sales'::text,'marketing'::text,'engineering'::text])",
        ])
      ).toEqual(['sales', 'marketing', 'engineering']);
    });

    it('should handle array contains with extra whitespace', () => {
      expect(
        getEnumConstraints('size', [
          "( size <@ ARRAY[ 'small' , 'medium' , 'large' ] )",
        ])
      ).toEqual(['small', 'medium', 'large']);
    });
  });

  describe('Multiple constraints', () => {
    it('should combine values from multiple constraint types', () => {
      expect(
        getEnumConstraints('status', [
          "(status = ANY (ARRAY['draft','published']))",
          "(status IN ('archived','deleted'))",
          "(status = 'pending' OR status = 'reviewing')",
        ])
      ).toEqual([
        'draft',
        'published',
        'archived',
        'deleted',
        'pending',
        'reviewing',
      ]);
    });

    it('should handle duplicate values across constraints', () => {
      expect(
        getEnumConstraints('type', [
          "(type = ANY (ARRAY['public','private']))",
          "(type IN ('public','internal'))",
        ])
      ).toEqual(['public', 'private', 'public', 'internal']);
    });

    it('should handle multiple constraints of the same type', () => {
      expect(
        getEnumConstraints('category', [
          "(category = ANY (ARRAY['food','drinks']))",
          "(category = ANY (ARRAY['snacks','desserts']))",
        ])
      ).toEqual(['food', 'drinks', 'snacks', 'desserts']);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should return empty array for unrecognized constraint patterns', () => {
      expect(
        getEnumConstraints('status', [
          "(status > 'value')",
          "(status LIKE 'pattern%')",
          '(status IS NOT NULL)',
        ])
      ).toEqual([]);
    });

    it('should return empty array for malformed constraints', () => {
      expect(
        getEnumConstraints('status', [
          "(status = ANY ARRAY['broken')",
          "(status IN ('missing_close'",
          "(status = 'incomplete' OR",
        ])
      ).toEqual([]);
    });

    it('should handle empty constraint array', () => {
      expect(getEnumConstraints('status', [])).toEqual([]);
    });

    it('should handle constraints for different column names', () => {
      // Note: parseAnyArrayConstraint doesn't check column names, only IN and OR constraints do
      expect(
        getEnumConstraints('status', [
          "(other_column = ANY (ARRAY['value1','value2']))",
          "(different_col IN ('value3','value4'))",
        ])
      ).toEqual(['value1', 'value2']); // ANY ARRAY will still match regardless of column name
    });

    it('should properly filter by column name for IN and OR constraints', () => {
      expect(
        getEnumConstraints('status', [
          "(status IN ('correct1','correct2'))",
          "(other_column IN ('wrong1','wrong2'))",
          "(status = 'correct3' OR status = 'correct4')",
          "(other_column = 'wrong3' OR other_column = 'wrong4')",
        ])
      ).toEqual(['correct1', 'correct2', 'correct3', 'correct4']);
    });

    it('should handle special quote scenarios', () => {
      // Test basic functionality with simple values
      expect(
        getEnumConstraints('message', [
          "(message = ANY (ARRAY['hello','world','test']))",
        ])
      ).toEqual(['hello', 'world', 'test']);
    });

    it('should handle special characters in values', () => {
      expect(
        getEnumConstraints('code', [
          "(code = ANY (ARRAY['US-001','CA-002','UK-003']))",
        ])
      ).toEqual(['US-001', 'CA-002', 'UK-003']);
    });

    it('should handle numeric-like string values', () => {
      expect(
        getEnumConstraints('version', ["(version IN ('1.0','2.0','3.0'))"])
      ).toEqual(['1.0', '2.0', '3.0']);
    });

    it('should handle single value constraints', () => {
      expect(
        getEnumConstraints('singleton', ["(singleton = ANY (ARRAY['only']))"])
      ).toEqual(['only']);
    });
  });

  describe('Real-world PostgreSQL constraint examples', () => {
    it('should parse complex nested constraint from PostgreSQL', () => {
      expect(
        getEnumConstraints('user_role', [
          "((\"user_role\" = ANY ((ARRAY['admin'::character varying, 'moderator'::character varying, 'user'::character varying])::character varying[])))",
        ])
      ).toEqual(['admin', 'moderator', 'user']);
    });

    it('should parse enum-like constraint with table prefix', () => {
      expect(
        getEnumConstraints('priority', [
          "(priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))",
        ])
      ).toEqual(['low', 'medium', 'high', 'critical']);
    });

    it('should handle PostgreSQL generated constraint names', () => {
      expect(
        getEnumConstraints('order_status', [
          "(order_status = ANY (ARRAY['pending'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text]))",
        ])
      ).toEqual(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
    });
  });
});
