# duchinese-helper

Browser userscript that adds features to duchinese.net (Mandarin Chinese learning content)

For the impatient who just want to see what it does — [example screenshot](#example-screenshot).

## Disclaimer

**Note**: This is a third-party extension and not supported by the official DuChinese site: https://duchinese.net/

Unofficial extensions like this can cause unexpected behavior. If you have any issues using duchinese.net, please make sure you've completely disabled this userscript and restarted your browser before contacting their support.

## Synopsis

This extension adds a number of features to [DuChinese](https://duchinese.net), a site that provides learning content for people studying Mandarin Chinese.

*Note*: The extension provides an alternative interface for viewing/interacting with the lesson content. It does not replace any existing elements. So, for example, unfortunately its theming capabilities only apply to that area. It can't, for example, force the entire site to use a dark theme.

## Features

### Fonts

You can configure font size and weight. The extension will provide a number of options for font families as well.

### Themes

It's possible configure the color scheme the lesson content/interface is provided in.

### Annotations

There are two main types of annotation available: text based (for example, to provide the pinyin for a character) and color-based (for example, to show the tone of the syllable).

##### Visibility

Annotations (tone colors included, but configurable independently) can have their visibility based on:

1. Whether it's the first time the word has been seen in a lesson.
2. HSK level.
3. Whether the containing sentence is hovered.

##### Text

Characters can be annotated with pinyin, IPA, zhuyin (bopomofo), HSK level, tone number, traditional or simplified hanzi (to aid in learning the alternative set of characters).

The annotation position can also be set to appear before, after, above or below the word or even oriented vertically (useful for zhuyin).

##### Tone Color

Characters can be colored based on the tone of the syllable. 

##### Sandhi

You can enable displaying a mark below characters where a tone change occurs or is expected to occur. For example, multiple tone 3 syllables in a row.

### Audio

The extension adds a normal audio element, this allows adjusting the volume or seeking through the content directly. It is also possible to download the audio using this. The extension also adds the ability to set a default volume level and playback speed.

As with the normal site interface, it is possible to click within the lesson text to seek to that part of the audio and while audio is playing the current syllable/word/sentence will be tracked.

### Vocabulary

The extension adds a collapsible vocabulary section which will show a list of words in the lesson, organized by HSK level. If the word doesn't appear in HSK, it will appear as "Other" or "Name". There are also some statistics available such as average HSK level. It is possible to click on a word to hear it spoken (from the location it appeared in the lesson).

### Misc

You can copy the text of the lesson to clipboard.

## Interface

* ⚙️ — Toggle configuration section visibility.
* 👀 — Toggle lesson text visibility.
* 💬 — Copy lesson text to clipboard.
* 📚 — Toggle vocabulary section visibility.

### Example screenshot

![image](https://user-images.githubusercontent.com/44031344/211049299-d51910ea-1859-4a3b-96fc-825fd882fbea.png)

## Installation

First, you will need to be using a browser that supports userscripts. This includes most desktop browsers but mobile browsers generally don't include these features. (I believe Kiwi Browser on Android may be the only one.) Additionally, most browsers allow userscripts via an extension, which means you'd need to install the userscript extension first and then use that to install userscripts.

Greasyfork is a repository for userscripts. The main page includes helpful information for how to get and install userscripts for various browsers (Chrome, Firefox, etc): https://greasyfork.org/

Once your browser is set up correctly, please visit this link for where this specific userscript is published: https://greasyfork.org/en/scripts/457745-dc-helper

## Issues/Limitations/Questions

### Known Issues

1. When previewing vocabulary, you may need to wait until the audio finishes loading before clicking a word will play.
2. The interface is pretty ugly. I'm not a UI designer.
3. The code is pretty ugly. I'm not a JavaScript developer. It's thrown together, but seems to work.

### Reporting Issues

Please create a GitHub issue describing your problem with as much detail as possible.

### Questions/Feature Requests

The best way is to create an issue, as described above.

### Did You Have Permission To Make This

I wouldn't go that far, but DuChinese is aware of it, had access to the source and didn't appear to have a problem with what I'm doing. The most controversial features are allowing downloading the audio and copying the lesson text to the clipboard: they didn't ask me to prevent people from doing this or remove that option.

***Please*** use/modify this extension in good faith so they don't have a reason to try to prevent this kind of thing from existing. Also, to avoid being a jerk.

### Is There Tracking/Monetization

None of the code I wrote does or will do anything like that. There is one small external dependency which is used to provide some functions. I verified that it doesn't do anything sinister, but I also can't control other people. It's unlikely to ever be a problem, but just saying "No" here technically wouldn't be 100% true.

### Oh No I Saw The Word Spy

Don't worry, this doesn't mean you're being spied on or tracked. The extension uses a third party library (mentioned above) called `xspy` which allows a script to watch what requests occur _only in its own window_. This is only used to collect the lesson content when the main site requests it. 
