## Me
In Markdown how can I annotate references? E.g.: I want to add some reference to documentation that I was looking up in my dev diary. But also I want to add links (e.g.: Documentation that I consulted), but this does not necessarily has a reference. Should I keep it in references, or should I name it sources?

## AI Assistant
Both **“References”** and **“Sources”** are valid, but they imply slightly different things:

- **References** usually means materials directly referred to or used in the text.
- **Sources** is broader and can include documentation, articles, discussions, notes, and other material you consulted.
- **Further reading** suggests links that are useful but were not necessarily used.
- **Resources** is a neutral, broad category for useful links.

For a development diary, I would use **Sources** if you want one general list:

```markdown
## Sources

- [Uint8Array – JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)
- [Map – JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [Positive and Non-Negative Vectors](../ai-transcripts/2026-08-18-positive-non-negative-vectors.md)
```


If you want to distinguish between material that influenced your work and merely useful links, use separate sections:

```markdown
## References

- [Uint8Array – JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)
- [Map – JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)

## Consulted documentation

- [MDN Web Docs](https://developer.mozilla.org/en-US/)
```


Or, more compactly:

```markdown
## Sources

### Referenced

- [Uint8Array – JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)

### Consulted

- [MDN Web Docs](https://developer.mozilla.org/en-US/)
- [UInt8Array Byte Order](../ai-transcripts/2026-08-18-uint8-byte-order.md)
```


For your particular use case, I would recommend **Sources** as the main heading. It accurately covers both:

1. documentation that directly informed a decision, and
2. links you looked at without directly referencing them in the diary.

You can make the distinction in the bullet text when useful:

```markdown
## Sources

- [Uint8Array – JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) — used to check typed-array behavior
- [MDN Web Docs](https://developer.mozilla.org/en-US/) — documentation consulted generally
- [Positive and Non-Negative Vectors](../ai-transcripts/2026-08-18-positive-non-negative-vectors.md) — discussion related to vector representation
```


One small terminology note: **`Uint8ClampedArray`**, **`Uint32Array`**, and **`Uint8Array`** are the official spellings, including the lowercase `int` in `Uint`.

## Me
But can I not annotate my references with a small 1 to make it clear what my text references? How would I do that?

## AI Assistant
Yes. You can use **reference markers**—small numbers such as `[^1]` or `[1]`—in the text and define the corresponding references below.

For a diary, Markdown’s **footnote syntax** is usually the clearest option:

```markdown
I looked up how `Uint8Array` stores values.[^1] I also checked how
JavaScript's `Map` works.[^2]

## Sources

[^1]: [Uint8Array – JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)
[^2]: [Map – JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
```


This is rendered approximately as:

> I looked up how `Uint8Array` stores values.[1] I also checked how JavaScript’s `Map` works.[2]
>
> **Sources**
>
> [1] Uint8Array – JavaScript | MDN  
> [2] Map – JavaScript | MDN

## Footnotes versus numbered links

There are two common approaches.

### Footnotes: `[^1]`

```markdown
The map data uses a typed array.[^1]

[^1]: [Uint8Array – JavaScript | MDN](https://developer.mozilla.org/...)
```


Use this when the source is associated with a particular statement. Footnotes are semantically appropriate and often provide clickable back-links to the text.

You can also use descriptive identifiers instead of numbers:

```markdown
The map data uses a typed array.[^typed-array]

[^typed-array]: [Uint8Array – JavaScript | MDN](https://developer.mozilla.org/...)
```


The rendered result will usually still display a numbered marker.

### Ordinary numbered links: `[1]`

```markdown
The map data uses a typed array [1].

## Sources

1. [Uint8Array – JavaScript | MDN](https://developer.mozilla.org/...)
2. [Map – JavaScript | MDN](https://developer.mozilla.org/...)
```


This is more portable because basic Markdown processors generally support numbered lists and links. However, `[1]` is only visual convention; it does not automatically connect the marker to item 1. You would need to make it an actual link:

```markdown
The map data uses a typed array [[1]](#source-1).

## Sources

1. <a id="source-1"></a>[Uint8Array – JavaScript | MDN](https://developer.mozilla.org/...)
```


The exact HTML-anchor behavior depends on the Markdown renderer.

## Recommended style

For your diary, I would use footnotes:

```markdown
I used `Uint8Array` for the map data after checking its behavior in the
MDN documentation.[^uint8-array]

I also considered how a `Map` would work for the data structure.[^map]

## Sources

[^uint8-array]: [Uint8Array – JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)
[^map]: [Map – JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
```


Keep general or broadly consulted material without a marker:

```markdown
## Sources

[^uint8-array]: [Uint8Array – JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)
[^map]: [Map – JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)

- [MDN Web Docs](https://developer.mozilla.org/en-US/)
- [Positive and Non-Negative Vectors](../ai-transcripts/2026-08-18-positive-non-negative-vectors.md)
```


This makes it clear which sources support specific statements while still allowing you to list material that you merely consulted. Note that footnotes are not part of the original Markdown specification, so confirm that your Markdown viewer supports them. GitHub, many documentation tools, and most modern Markdown renderers do.

## Me
Can I link to git commits in any meaningful way?

## AI Assistant
Yes. A Git commit can be linked meaningfully using its **commit URL**, preferably with its short hash and a description.

## GitHub

Use a URL containing the repository and commit hash:

```markdown
I implemented the initial map representation in [`a1b2c3d`](https://github.com/OWNER/REPOSITORY/commit/a1b2c3d4e5f6...)
```


The full hash in the URL is best. The short hash is only the visible label.

You can also use GitHub’s compare or pull-request links:

```markdown
- [Initial map representation (`a1b2c3d`)](https://github.com/OWNER/REPOSITORY/commit/a1b2c3d4e5f6...)
- [Map representation changes](https://github.com/OWNER/REPOSITORY/compare/oldhash...newhash)
- [Implement map representation](https://github.com/OWNER/REPOSITORY/pull/12)
```


## GitLab

The equivalent commit URL is:

```markdown
[`a1b2c3d`](https://gitlab.com/OWNER/REPOSITORY/-/commit/a1b2c3d4e5f6...)
```


## Self-hosted or other Git servers

The URL format depends on the server, but the principle is the same:

```markdown
[Implement map representation (`a1b2c3d`)](https://git.example.com/OWNER/REPOSITORY/commit/a1b2c3d4e5f6...)
```


## Using a footnote

If the commit supports a particular statement in your diary, you can cite it with a footnote:

```markdown
The world now moves relative to the character.[^world-movement]

## Sources

[^world-movement]: [Implement camera-relative world movement (`a1b2c3d`)](https://github.com/OWNER/REPOSITORY/commit/a1b2c3d4e5f6...)
```


A commit is usually better classified as **evidence**, **implementation**, or a **project record** rather than a general source. You could separate it like this:

```markdown
## Sources

- [Uint8Array – JavaScript | MDN](https://developer.mozilla.org/...)

## Related commits

- [Implement camera-relative world movement (`a1b2c3d`)](https://github.com/OWNER/REPOSITORY/commit/a1b2c3d4e5f6...)
```


## Stable versus temporary links

Use the full commit hash rather than a branch link:

```markdown
<!-- Stable: points to the exact historical state -->
https://github.com/OWNER/REPOSITORY/commit/a1b2c3d4e5f6...

<!-- Less stable: changes as the branch changes -->
https://github.com/OWNER/REPOSITORY/tree/main
```


A commit link remains meaningful even if later commits modify or delete the referenced code. For a private repository, however, the link will only work for people who have access to that repository.
