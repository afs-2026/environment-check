import parser from '@apidevtools/swagger-parser';
await parser.validate('openapi.json');
console.log('OpenAPI valid');
