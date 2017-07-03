export default {
  entry: 'dist/index.js',
  dest: 'dist/bundles/angular4-keycloak.umd.js',
  sourceMap: false,
  format: 'umd',
  moduleName: 'ng.angular4-keycloak',
  globals: {
    '@angular/common': 'ng.common',
    '@angular/core': 'ng.core',
    '@angular/http': 'ng.http',
    'rxjs/Observable': 'Rx',
    'rxjs/ReplaySubject': 'Rx',
    'rxjs/add/operator/map': 'Rx.Observable.prototype',
    'rxjs/add/operator/mergeMap': 'Rx.Observable.prototype',
    'rxjs/add/observable/fromEvent': 'Rx.Observable',
    'rxjs/add/observable/of': 'Rx.Observable'
  }
}