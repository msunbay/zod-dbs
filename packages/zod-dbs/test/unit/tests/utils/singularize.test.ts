import { singularize } from '../../../../src/utils/singularize.js';

describe('singularize', () => {
  it('should singularize words ending with "ies"', () => {
    expect(singularize('categories')).toBe('category');
    expect(singularize('companies')).toBe('company');
    expect(singularize('bodies')).toBe('body');
    expect(singularize('parties')).toBe('party');
  });

  it('should singularize words ending with "xes", "ches", "shes", "ses", "zes", "oes"', () => {
    expect(singularize('boxes')).toBe('box');
    expect(singularize('wishes')).toBe('wish');
    expect(singularize('churches')).toBe('church');
    expect(singularize('bushes')).toBe('bush');
    expect(singularize('cases')).toBe('case');
    expect(singularize('heroes')).toBe('hero');
    expect(singularize('foxes')).toBe('fox');
    expect(singularize('buzzes')).toBe('buzz');
  });

  it('should singularize words ending with "es" (not covered above)', () => {
    expect(singularize('buses')).toBe('bus');
  });

  it('should singularize words ending with "s" (but not "ss")', () => {
    expect(singularize('cats')).toBe('cat');
    expect(singularize('dogs')).toBe('dog');
    expect(singularize('albums')).toBe('album');
    expect(singularize('cars')).toBe('car');
    expect(singularize('class')).toBe('class');
    expect(singularize('glass')).toBe('glass');
  });

  it('should not singularize ignored words', () => {
    expect(singularize('status')).toBe('status');
    expect(singularize('Status')).toBe('Status');
    expect(singularize('business')).toBe('business');
    expect(singularize('data')).toBe('data');
  });

  it('should handle known irregulars', () => {
    expect(singularize('children')).toBe('child');
    expect(singularize('people')).toBe('person');
    expect(singularize('men')).toBe('man');
    expect(singularize('women')).toBe('woman');
    expect(singularize('feet')).toBe('foot');
    expect(singularize('teeth')).toBe('tooth');
    expect(singularize('geese')).toBe('goose');
    expect(singularize('mice')).toBe('mouse');
    expect(singularize('oxen')).toBe('ox');
    expect(singularize('criteria')).toBe('criterion');
    expect(singularize('indices')).toBe('index');
    expect(singularize('statuses')).toBe('status');
    expect(singularize('analyses')).toBe('analysis');
    expect(singularize('diagnoses')).toBe('diagnosis');
    expect(singularize('matrices')).toBe('matrix');
    expect(singularize('vertices')).toBe('vertex');
    expect(singularize('roles')).toBe('role');
  });

  it('should return the word unchanged if not plural', () => {
    expect(singularize('cat')).toBe('cat');
    expect(singularize('bus')).toBe('bus');
    expect(singularize('hero')).toBe('hero');
    expect(singularize('fox')).toBe('fox');
  });
});
