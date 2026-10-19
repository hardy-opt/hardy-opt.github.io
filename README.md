# hardy-opt.github.io

Source for my research site: **[hardy-opt.github.io](https://hardy-opt.github.io/)**

Optimization algorithms for large-scale machine learning, and the systems that decide what is worth
computing or measuring next. The site covers the research, the project write-ups, the publications
and a set of longer technical posts.

| Section                                                   | What is there                                                                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Research](https://hardy-opt.github.io/research/)         | Second-order and variance-reduced methods, Bayesian optimization under budget, heuristic search, knowledge representation |
| [Projects](https://hardy-opt.github.io/projects/)         | Industrial R&D write-ups, published optimization research, one learning project                                           |
| [Publications](https://hardy-opt.github.io/publications/) | Journal and conference papers, preprints, doctoral thesis                                                                 |
| [Blog](https://hardy-opt.github.io/blog/)                 | Longer pieces on optimization in modern AI, research methodology, and applications across fields                          |
| [CV](https://hardy-opt.github.io/cv/)                     | Full curriculum vitae, also downloadable as a PDF                                                                         |

## Building locally

Requires Ruby with Bundler. ImageMagick is optional and only needed for responsive image variants.

```bash
bundle install
bundle exec jekyll serve
```

The site is built and deployed to the `gh-pages` branch by GitHub Actions on every push to `main`.

Code formatting is checked by Prettier in CI:

```bash
npx prettier . --check
```

## Credits

Built with [Jekyll](https://jekyllrb.com/) and the
[al-folio](https://github.com/alshedivat/al-folio) theme.

## Contact

**hardiktankaria1406@gmail.com**
