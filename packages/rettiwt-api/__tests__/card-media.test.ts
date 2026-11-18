import { describe, expect, it } from 'vitest'
import { mapTwitterCard } from '../helper/parseTweet'

function unifiedCard(payload: Record<string, unknown>) {
  return {
    legacy: {
      name: 'unified_card',
      binding_values: [
        { key: 'unified_card', value: { string_value: JSON.stringify(payload) } },
      ],
    },
  }
}

describe('mapTwitterCard · unified card media', () => {
  it('keeps carousel order, per-image hrefs, color and CTA', () => {
    const card = mapTwitterCard(unifiedCard({
      type: 'image_carousel_website',
      components: ['swipeable_media_1', 'details_1'],
      component_objects: {
        swipeable_media_1: {
          data: {
            media_list: [
              { id: '3_1', destination: 'browser_1' },
              { id: '3_2', destination: 'browser_2' },
            ],
          },
        },
        details_1: {
          data: {
            title: { content: '\u200b' },
            subtitle: { content: 'example.com' },
          },
        },
      },
      destination_objects: {
        browser_1: { type: 'browser', data: { url_data: { url: 'https://example.com/1', vanity: 'example.com' } } },
        browser_2: { type: 'browser', data: { url_data: { url: 'https://example.com/2', vanity: 'example.com' } } },
      },
      media_entities: {
        '3_1': {
          media_url_https: 'https://pbs.twimg.com/1.jpg',
          original_info: { width: 1440, height: 1800 },
          ext: { mediaColor: { r: { ok: { palette: [{ rgb: { r: 255, g: 235, b: 157 } }] } } } },
        },
        '3_2': {
          media_url_https: 'https://pbs.twimg.com/2.jpg',
          original_info: { width: 1440, height: 1800 },
        },
      },
      experiment_signals: { website_cta_card_label: 'learn_more' },
    }))

    expect(card?.layout).toBe('image_carousel')
    expect(card?.images).toHaveLength(2)
    expect(card?.images?.[0]).toMatchObject({
      url: 'https://pbs.twimg.com/1.jpg',
      href: 'https://example.com/1',
      color: '#ffeb9d',
    })
    expect(card?.imageUrl).toBe('https://pbs.twimg.com/1.jpg')
    expect(card?.ctaLabel).toBe('了解更多')
    expect(card?.title).toBe('')
  })

  it('parses a single image card and video cover metadata', () => {
    const image = mapTwitterCard(unifiedCard({
      type: 'image_website',
      components: ['media_1', 'details_1'],
      component_objects: {
        media_1: { data: { id: '3_1', destination: 'browser_1' } },
        details_1: { data: { title: { content: 'Hello' }, subtitle: { content: 'example.com' } } },
      },
      destination_objects: {
        browser_1: { type: 'browser', data: { url_data: { url: 'https://example.com', vanity: 'example.com' } } },
      },
      media_entities: {
        '3_1': { media_url_https: 'https://pbs.twimg.com/1.jpg', original_info: { width: 1200, height: 900 } },
      },
    }))

    expect(image?.layout).toBe('image_card')
    expect(image?.images).toHaveLength(1)
    expect(image?.title).toBe('Hello')

    const video = mapTwitterCard(unifiedCard({
      type: 'video_website',
      components: ['media_1'],
      component_objects: {
        media_1: { data: { id: '13_1' } },
      },
      media_entities: {
        '13_1': {
          type: 'video',
          media_url_https: 'https://pbs.twimg.com/cover.jpg',
          original_info: { width: 720, height: 900 },
          video_info: {
            duration_millis: 6006,
            variants: [
              { content_type: 'video/mp4', bitrate: 832000, url: 'https://video.twimg.com/low.mp4' },
              { content_type: 'video/mp4', bitrate: 2176000, url: 'https://video.twimg.com/high.mp4' },
              { content_type: 'application/x-mpegURL', url: 'https://video.twimg.com/playlist.m3u8' },
            ],
          },
        },
      },
    }))

    expect(video?.layout).toBe('video_card')
    expect(video?.images?.[0]).toMatchObject({
      type: 'video',
      video: {
        mp4: 'https://video.twimg.com/high.mp4',
        hls: 'https://video.twimg.com/playlist.m3u8',
        durationMs: 6006,
      },
    })
  })
})
