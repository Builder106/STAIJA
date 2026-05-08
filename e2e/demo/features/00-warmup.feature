Feature: Warmup

  # Two warmup scenarios work around a Playwright quirk where the first
  # one or two videos in single-worker demo runs can be written as 0
  # bytes. The reporter detects them by slug prefix and discards their
  # videos before the webm → mp4 conversion step.

  Scenario: Warmup A
    Given I am on the home page

  Scenario: Warmup B
    Given I am on the home page
