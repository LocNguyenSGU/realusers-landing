import type { DefaultNodeTypes, SerializedBlockNode, SerializedHeadingNode, SerializedUploadNode } from '@payloadcms/richtext-lexical'
import { RichText as LexicalRichText, type JSXConvertersFunction, LinkJSXConverter } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'

import type { CalloutBlock, CtaBlock, Media, Post } from '@/payload-types'

import { headingIds, type RichTextValue } from '@/lib/lexical'
import { mediaDims, mediaUrl } from '@/lib/media'
import { paths } from '@/lib/site'

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<CtaBlock | CalloutBlock>

/**
 * Render nội dung Lexical ra HTML. Heading được gán id (khớp mục lục), ảnh dùng next/image (WebP, đúng cỡ),
 * link nội bộ tới bài khác ra /blog/<slug>/.
 */
export function RichText({ data }: { data: Post['content'] }) {
  const ids = headingIds(data as RichTextValue).map((h) => h.id)
  let headingIndex = 0

  const converters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkJSXConverter({
      internalDocToHref: ({ linkNode }) => {
        const doc = linkNode.fields.doc
        const value = doc?.value
        if (doc?.relationTo === 'posts' && value && typeof value === 'object' && 'slug' in value) {
          return paths.post(String(value.slug))
        }
        return '/'
      },
    }),
    heading: ({ node, nodesToJSX }) => {
      const n = node as SerializedHeadingNode
      const Tag = n.tag
      const id = ids[headingIndex++]
      return <Tag id={id}>{nodesToJSX({ nodes: n.children })}</Tag>
    },
    upload: ({ node }) => {
      const n = node as SerializedUploadNode
      const media = (typeof n.value === 'object' ? n.value : null) as Media | null
      const src = mediaUrl(media, 'hero')
      if (!media || !src) return null
      const { width, height } = mediaDims(media, 'hero')
      return (
        <figure>
          <Image src={src} alt={media.alt} width={width} height={height} sizes="(max-width:760px) 100vw, 720px" />
          {media.caption ? <figcaption>{media.caption}</figcaption> : null}
        </figure>
      )
    },
    blocks: {
      cta: ({ node }) => (
        <aside className="chot">
          <h2>{node.fields.title}</h2>
          {node.fields.text ? <p>{node.fields.text}</p> : null}
          <a className="btn btn-primary" href={node.fields.url}>
            {node.fields.buttonLabel}
          </a>
        </aside>
      ),
      callout: ({ node }) => (
        <aside className={`callout ${node.fields.tone}`}>
          {node.fields.title ? <strong>{node.fields.title}</strong> : null}
          <p>{node.fields.text}</p>
        </aside>
      ),
    },
  })

  return <LexicalRichText className="body" converters={converters} data={data} disableContainer={false} />
}
