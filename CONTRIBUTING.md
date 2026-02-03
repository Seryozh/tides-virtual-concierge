# Contributing to Tides Virtual Concierge

Thank you for your interest in contributing to Tides Virtual Concierge! This document provides guidelines and instructions for contributing to the project.

## 🤝 Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and collaborative environment for everyone.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/tides-virtual-concierge.git
   cd tides-virtual-concierge
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/tides-virtual-concierge.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment variables** (see `.env.example`)

## 🌿 Branching Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring

### Creating a Branch

```bash
git checkout -b feature/your-feature-name
```

## 📝 Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(api): add rate limiting to chat endpoint

fix(ui): resolve language selector not updating state

docs(readme): update deployment instructions
```

## 🧪 Testing

Before submitting a pull request:

1. **Test your changes locally**:
   ```bash
   npm run dev
   ```

2. **Check for TypeScript errors**:
   ```bash
   npx tsc --noEmit
   ```

3. **Run linting**:
   ```bash
   npm run lint
   ```

## 📥 Submitting a Pull Request

1. **Update your fork**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub

4. **Fill out the PR template** with:
   - Description of changes
   - Related issue number (if applicable)
   - Screenshots (for UI changes)
   - Testing steps

5. **Wait for review** and address any feedback

## 🔍 Code Review Process

- All PRs require at least one approval
- CI checks must pass
- Code should follow existing patterns and conventions
- New features should include documentation updates

## 💡 Development Guidelines

### TypeScript

- Use explicit types (avoid `any`)
- Leverage type inference where appropriate
- Add JSDoc comments for complex functions

### React

- Use functional components with hooks
- Keep components focused and single-purpose
- Use proper prop types

### API Routes

- Validate input with Zod schemas
- Handle errors gracefully
- Log important events for debugging
- Use Edge Runtime for performance-critical routes

### Styling

- Use Tailwind CSS utility classes
- Follow the existing dark theme color scheme
- Ensure responsive design

### Database

- Write efficient queries
- Use proper indexes
- Never expose sensitive data
- Follow RLS policies

## 🐛 Reporting Bugs

When reporting bugs, include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**:
   - OS and version
   - Node.js version
   - Browser (if applicable)
6. **Screenshots/Logs**: Any relevant screenshots or error logs

## 💡 Suggesting Features

When suggesting features:

1. **Use Case**: Describe the problem or use case
2. **Proposed Solution**: Your proposed implementation
3. **Alternatives**: Other solutions you've considered
4. **Impact**: Who would benefit from this feature

## 📚 Documentation

Documentation improvements are always welcome:

- Fix typos or unclear instructions
- Add examples or clarifications
- Translate documentation
- Create tutorials or guides

## ❓ Questions?

If you have questions:

1. Check existing issues and discussions
2. Review the README and documentation
3. Open a new discussion on GitHub

## 🎉 Recognition

Contributors will be recognized in the project README and release notes.

---

Thank you for contributing to Tides Virtual Concierge! 🙏
