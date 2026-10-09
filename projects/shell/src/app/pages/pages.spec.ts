import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePage } from './home.page';
import { RemoteErrorPage } from './remote-error.page';

describe('shell pages', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }),
  );

  it('HomePage lists the remotes declared in the manifest', async () => {
    const fixture = TestBed.createComponent(HomePage);
    TestBed.tick();
    TestBed.inject(HttpTestingController)
      .expectOne('federation.manifest.json')
      .flush({ catalogo: 'http://localhost:4201/remoteEntry.json' });
    await fixture.whenStable();

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.remotes li');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('catalogo');
    expect(items[0].textContent).toContain('http://localhost:4201/remoteEntry.json');
  });

  it('RemoteErrorPage names the remote that failed', async () => {
    const fixture = TestBed.createComponent(RemoteErrorPage);
    fixture.componentRef.setInput('remoteName', 'carrito');
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('carrito');
  });
});
