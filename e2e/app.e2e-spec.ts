import { DataServicePage } from './app.po';

describe('data-service App', () => {
  let page: DataServicePage;

  beforeEach(() => {
    page = new DataServicePage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
