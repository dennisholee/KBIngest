# Contributing to KB Extension

Thank you for your interest in contributing! This document provides guidelines for development.

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build: `npm run compile`
4. Start developing: `npm run watch`

## Commit Guidelines

Use conventional commits for consistency:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Test additions or modifications
- **chore**: Build process, dependencies, tooling

### Examples
```
feat(storage): add document indexing
fix(chat): resolve null reference in message handler
docs: update API documentation
```

## Code Standards

### TypeScript
- Enable strict mode (configured in tsconfig.json)
- Use explicit type annotations
- Avoid `any` types

### Testing
- Write tests for new features
- Ensure tests pass before submitting: `npm test`
- Aim for >80% code coverage

### Linting
- Run ESLint before committing: `npm run lint`
- Fix issues: `npm run lint -- --fix`

## Branch Conventions

- `main` - Production-ready code
- `develop` - Development branch
- `feature/description` - Feature branches
- `fix/description` - Bug fix branches

## Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes with meaningful commits
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Submit PR with clear description of changes
6. Address review feedback

## Performance Considerations

- Use lazy loading for heavy dependencies
- Profile code for memory leaks
- Consider extension startup time impact
- Test with large knowledge bases

## Debugging

### VS Code Debug Mode
1. Open the project in VS Code
2. Press F5 to start debugging
3. Set breakpoints and inspect state
4. View output in the Debug Console

### Terminal Debugging
```bash
npm run watch  # Compile in watch mode
# Make changes and test in debug window
```

## Questions?

Check the [README](./README.md) for more information about the project structure and available scripts.
