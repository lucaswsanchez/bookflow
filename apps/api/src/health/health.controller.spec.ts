import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports ok status', () => {
    expect(new HealthController().check().status).toBe('ok');
  });
});
