// No typescript definitions
import SwaggerUI from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';

import spec from '../../src/validations/openapi';

const ui = SwaggerUI({
  spec: spec,
  dom_id: '#swagger',
});

ui.initOAuth({
  appName: "Swagger UI Webpack Demo",
  // See https://demo.identityserver.io/ for configuration details.
  clientId: 'implicit'
});