import { describe, expect, it } from 'vitest'
import { mapPollCard } from '../parsers/poll'

function card(bindingValues: Array<{ key: string, value: Record<string, unknown> }>) {
  return {
    legacy: {
      name: 'poll2choice_text_only',
      binding_values: bindingValues,
    },
  }
}

describe('mapPollCard', () => {
  it('parses text choices and computes percentages', () => {
    const poll = mapPollCard(card([
      { key: 'choice1_label', value: { string_value: 'Yes' } },
      { key: 'choice1_count', value: { string_value: '750' } },
      { key: 'choice2_label', value: { string_value: 'No' } },
      { key: 'choice2_count', value: { string_value: '250' } },
      { key: 'counts_are_final', value: { boolean_value: true } },
    ]))

    expect(poll).toEqual({
      choices: [
        { label: 'Yes', count: 750, percentage: 75 },
        { label: 'No', count: 250, percentage: 25 },
      ],
      totalVotes: 1000,
      countsAreFinal: true,
      endDatetime: undefined,
      durationMinutes: undefined,
      hasImages: false,
    })
  })

  it('parses image choices, colors and US date format', () => {
    const poll = mapPollCard(card([
      { key: 'choice1_label', value: { string_value: 'A' } },
      { key: 'choice1_count', value: { string_value: '1,200' } },
      {
        key: 'choice1_image_original',
        value: { image_value: { url: 'https://pbs.twimg.com/a.jpg', width: 1200, height: 900 } },
      },
      {
        key: 'choice1_image_color',
        value: { image_color_value: { palette: [{ rgb: { red: 248, green: 220, blue: 232 } }] } },
      },
      { key: 'choice2_label', value: { string_value: 'B' } },
      { key: 'choice2_count', value: { string_value: '800' } },
      { key: 'end_datetime_utc', value: { string_value: '12/19/2022 11:20:32' } },
    ]))

    expect(poll?.choices[0]).toMatchObject({
      label: 'A',
      count: 1200,
      percentage: 60,
      imageUrl: 'https://pbs.twimg.com/a.jpg',
      imageWidth: 1200,
      imageHeight: 900,
      color: '#f8dce8',
    })
    expect(poll?.hasImages).toBe(true)
    expect(poll?.endDatetime).toBe('2022-12-19T11:20:32.000Z')
  })

  it('returns undefined for non-poll cards and single-choice data', () => {
    expect(mapPollCard({ legacy: { name: 'summary', binding_values: [] } })).toBeUndefined()
    expect(mapPollCard(card([
      { key: 'choice1_label', value: { string_value: 'Only' } },
    ]))).toBeUndefined()
  })
})
