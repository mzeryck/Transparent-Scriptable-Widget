// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: image;

// This widget was created by Max Zeryck @mzeryck

/*
 * Change the widget settings and test out the widget in this section.
 * ===================================================================
 */

/* -- PREVIEW YOUR WIDGET -- */

// Change to true to see a preview of your widget.
const testMode = true

// Optionally specify the size of your widget preview.
const widgetPreview = "large"

/* -- GREETING AND DATE -- */

// Optionally show a greeting based on the time of day.
const showGreeting = true

// Choose the date style. "iOS" matches the default calendar app (like: THURSDAY 29)
// Or, use docs.scriptable.app/dateformatter to write your own format.
const dateDisplay = "EEEE, MMMM d"

/* -- EVENTS -- */

// Change to false to hide events.
const showEvents = true

// Choose whether to show all-day events.
const showAllDay = true

// Specify how many events to show.
const numberOfEvents = 4

// Optionally show tomorrow's events.
const showTomorrow = true

// Write a message when there are no events, or change to "" for blank.
const noEventMessage = "Enjoy the rest of your day."

/* -- SPACING -- */

// Can be top, middle, or bottom.
const verticalAlignment = "middle"

// Can be left, center, or right.
const horizontalAlignment = "left"

// The spacing between each element. 
const elementSpacing = 12

/* -- FONTS AND TEXT -- */

// Use iosfonts.com, or change to "" for the system font.
const fontName = "Futura-Medium"

// Find colors on htmlcolorcodes.com
const fontColor = new Color("#ffffff")

// Change the font sizes for each element.
const greetingSize = 18
const dateSize = 34
const dayOfWeekSize = 13
const eventTitleSize = 14
const eventTimeSize = 12
const noEventMessageSize = 12

/* -- RESET YOUR WIDGET -- */

// Change to true to reset the widget background.
const resetWidget = false

/*
 * The code below this comment is the widget logic - a bit more complex.
 * =====================================================================
 */

/* -- GLOBAL VALUES -- */

// Widgets are unique based on the name of the script.
const filename = Script.name() + ".jpg"
const files = FileManager.local()
const path = files.joinPath(files.documentsDirectory(), filename)
const fileExists = files.fileExists(path)

// Store other global values.
const date = new Date()
let widget = new ListWidget()

// If we're in the widget or testing, build the widget.
if (config.runsInWidget || (testMode && fileExists && !resetWidget)) {

  widget.backgroundImage = files.readImage(path)

  if (verticalAlignment == "middle" || verticalAlignment == "bottom") {
    widget.addSpacer()
  }

  // Format the greeting if we need it.
  if (showGreeting) {
    let greetingText = makeGreeting()
    let greeting = widget.addText(greetingText)
    formatText(greeting, greetingSize)
    widget.addSpacer(elementSpacing)
  }

  // Format the date info.
  let df = new DateFormatter()
  if (dateDisplay.toLowerCase() == "ios") {
    df.dateFormat = "EEEE"
    let dayOfWeek = widget.addText(df.string(date).toUpperCase())
    let dateNumber = widget.addText(date.getDate().toString())

    formatText(dayOfWeek, dayOfWeekSize)
    formatText(dateNumber, dateSize)
  } else {
    df.dateFormat = dateDisplay
    let dateText = widget.addText(df.string(date))
    formatText(dateText, dateSize)
  }

  // Add events if we're supposed to.
  if (showEvents) {

    // Determine which events to show, and how many.
    const todayEvents = await CalendarEvent.today([])
    let shownEvents = 0
    
    for (const event of todayEvents) {
      if (shownEvents == numberOfEvents) {
        break
      }
      if (shouldShowEvent(event)) {
        displayEvent(widget, event)
        shownEvents++
      }
    }

    // If there's room and we need to, show tomorrow's events.
    let multipleTomorrowEvents = false
    if (showTomorrow && shownEvents < numberOfEvents) {

      const tomorrowEvents = await CalendarEvent.tomorrow([])

      for (const event of tomorrowEvents) {
        if (shownEvents == numberOfEvents) {
          break
        }
        if (shouldShowEvent(event)) {
          // Add the tomorrow label prior to the first tomorrow event.
          if (!multipleTomorrowEvents) {
            widget.addSpacer(elementSpacing)
            let tomorrowText = widget.addText("TOMORROW")
            formatText(tomorrowText, eventTitleSize)
            multipleTomorrowEvents = true
          }
          
          // Show the tomorrow event and increment the counter.
          displayEvent(widget, event)
          shownEvents++
        }
      }

    }

    // If there are no events and we have a message, display it.
    if (shownEvents == 0 && noEventMessage != "" && noEventMessage != null) {

      widget.addSpacer(elementSpacing)

      let noEvents = widget.addText(noEventMessage)
      formatText(noEvents, noEventMessageSize)
    }
  }

  if (verticalAlignment == "top" || verticalAlignment == "middle") {
    widget.addSpacer()
  }

  Script.setWidget(widget)
  if (testMode) {
    let widgetSizeFormat = widgetPreview.toLowerCase()
    if (widgetSizeFormat == "small")  { widget.presentSmall()  }
    if (widgetSizeFormat == "medium") { widget.presentMedium() }
    if (widgetSizeFormat == "large")  { widget.presentLarge()  }
  }
  Script.complete()

// If we're running normally, go to the calendar.
} else if (fileExists && !resetWidget) {

  const appleDate = new Date('2001/01/01')
  const timestamp = (date.getTime() - appleDate.getTime()) / 1000
  const callback = new CallbackURL("calshow:" + timestamp)
  callback.open()
  Script.complete()

// If it's the first time it's running, set up the widget background.
} else {

  // Determine if user has taken the screenshot.
  var message
  message = "Before you start, go to your home screen and enter wiggle mode. Scroll to the empty page on the far right and take a screenshot."
  let exitOptions = ["Continue", "Exit to Take Screenshot"]
  let shouldExit = await generateAlert(message, exitOptions)
  if (shouldExit) return

  // Get screenshot and determine phone size.
  let img = await Photos.fromLibrary()
  let height = img.size.height
  let phone = phoneSizes()[height]
  if (!phone) {
    message = "It looks like you selected an image that isn't an iPhone screenshot, or your iPhone is not supported. Try again with a different image."
    await generateAlert(message, ["OK"])
    return
  }

  // Prompt for widget size and position.
  message = "What size of widget are you creating?"
  let sizes = ["Small", "Medium", "Large"]
  let size = await generateAlert(message, sizes)
  let widgetSize = sizes[size]

  message = "What position will it be in?"
  message += (height == 1136 ? " (Note that your device only supports two rows of widgets, so the middle and bottom options are the same.)" : "")

  // Determine image crop based on phone size.
  let crop = { w: "", h: "", x: "", y: "" }
  if (widgetSize == "Small") {
    crop.w = phone.small
    crop.h = phone.small
    let positions = ["Top left", "Top right", "Middle left", "Middle right", "Bottom left", "Bottom right"]
    let position = await generateAlert(message, positions)

    // Convert the two words into two keys for the phone size dictionary.
    let keys = positions[position].toLowerCase().split(' ')
    crop.y = phone[keys[0]]
    crop.x = phone[keys[1]]

  } else if (widgetSize == "Medium") {
    crop.w = phone.medium
    crop.h = phone.small

    // Medium and large widgets have a fixed x-value.
    crop.x = phone.left
    let positions = ["Top", "Middle", "Bottom"]
    let position = await generateAlert(message, positions)
    let key = positions[position].toLowerCase()
    crop.y = phone[key]

  } else if (widgetSize == "Large") {
    crop.w = phone.medium
    crop.h = phone.large
    crop.x = phone.left
    let positions = ["Top", "Bottom"]
    let position = await generateAlert(message, positions)

    // Large widgets at the bottom have the "middle" y-value.
    crop.y = position ? phone.middle : phone.top
  }

  // Crop image and finalize the widget.
  let imgCrop = cropImage(img, new Rect(crop.x, crop.y, crop.w, crop.h))
  files.writeImage(path, imgCrop)
  message = "Your widget background is ready. If you haven't already granted Calendar access, it will pop up next."
  await generateAlert(message, ["OK"])

  // Make sure we have calendar access.
  await CalendarEvent.today([])

  Script.complete()
}

/*
 * Helper functions
 * ================
 */

// Return a greeting based on the time of day. Courtesy of riverwolf.
function makeGreeting() {
  let greeting = "Good "
  if (date.getHours() < 6) {
    greeting = greeting + "night."
  } else if (date.getHours() < 12) {
    greeting = greeting + "morning."
  } else if (date.getHours() < 17) {
    greeting = greeting + "afternoon."
  } else if (date.getHours() < 21) {
    greeting = greeting + "evening."
  } else {
    greeting = greeting + "night."
  }
  return greeting
}

// Determine if an event should be shown.
function shouldShowEvent(event) {

  // Hack to remove canceled Office 365 events.
  if (event.title.startsWith("Canceled:")) {
    return false
  }

  // If it's an all-day event, only show if the setting is active.
  if (event.isAllDay) {
    return showAllDay
  }

  // Otherwise, return the event if it's in the future.
  return (event.startDate.getTime() > date.getTime())
}

// Provide the specified font.
function provideFont(fontName, fontSize) {
  if (fontName == "" || fontName == null) {
    return Font.regularSystemFont(fontSize)
  } else {
    return new Font(fontName, fontSize)
  }
}

// Add an event to the widget.
function displayEvent(widget, event) {
  widget.addSpacer(elementSpacing)

  let title = widget.addText(event.title)
  formatText(title, eventTitleSize)

  // If it's an all-day event, we don't need a time.
  if (event.isAllDay) { return }

  widget.addSpacer(7)

  let time = widget.addText(formatTime(event.startDate))
  formatText(time, eventTimeSize)
}

// Formats the times under each event.
function formatTime(date) {
  let df = new DateFormatter()
  df.useNoDateStyle()
  df.useShortTimeStyle()
  return df.string(date)
}

// Format text based on the settings.
function formatText(textItem, fontSize) {
  textItem.font = provideFont(fontName, fontSize)
  textItem.textColor = fontColor
  if (horizontalAlignment == "right") {
    textItem.rightAlignText()
  } else if (horizontalAlignment == "center") {
    textItem.centerAlignText()
  } else {
    textItem.leftAlignText()
  }
}

// Determines if two dates occur on the same day
function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

// Generate an alert with the provided array of options.
async function generateAlert(message, options) {

  let alert = new Alert()
  alert.message = message

  for (const option of options) {
    alert.addAction(option)
  }

  let response = await alert.presentAlert()
  return response
}

// Crop an image into the specified rect.
function cropImage(img, rect) {

  let draw = new DrawContext()
  draw.size = new Size(rect.width, rect.height)

  draw.drawImageAtPoint(img, new Point(-rect.x, -rect.y))
  return draw.getImage()
}

// Pixel sizes and positions for widgets on all supported phones.
function phoneSizes() {
  let phones = {  
  
    // 12 and 12 Pro
    "2532": {
      small:  474,
      medium: 1014,
      large:  1062,
      left:  78,
      right: 618,
      top:    231,
      middle: 819,
      bottom: 1407
    },
  
    // 11 Pro Max, XS Max
    "2688": {
      small:  507,
      medium: 1080,
      large:  1137,
      left:  81,
      right: 654,
      top:    228,
      middle: 858,
      bottom: 1488
    },
  
    // 11, XR
    "1792": {
      small:  338,
      medium: 720,
      large:  758,
      left:  54,
      right: 436,
      top:    160,
      middle: 580,
      bottom: 1000
    },
    
    
    // 11 Pro, XS, X
    "2436": {
      small:  465,
      medium: 987,
      large:  1035,
      left:  69,
      right: 591,
      top:    213,
      middle: 783,
      bottom: 1353
    },
  
    // Plus phones
    "2208": {
      small:  471,
      medium: 1044,
      large:  1071,
      left:  99,
      right: 672,
      top:    114,
      middle: 696,
      bottom: 1278
    },
    
    // SE2 and 6/6S/7/8
    "1334": {
      small:  296,
      medium: 642,
      large:  648,
      left:  54,
      right: 400,
      top:    60,
      middle: 412,
      bottom: 764
    },
    
    
    // SE1
    "1136": {
      small:  282,
      medium: 584,
      large:  622,
      left: 30,
      right: 332,
      top:  59,
      middle: 399,
      bottom: 399
    },
    
    // 11 and XR in Display Zoom mode
    "1624": {
      small: 310,
      medium: 658,
      large: 690,
      left: 46,
      right: 394,
      top: 142,
      middle: 522,
      bottom: 902 
    },
    
    // Plus in Display Zoom mode
    "2001" : {
      small: 444,
      medium: 963,
      large: 972,
      left: 81,
      right: 600,
      top: 90,
      middle: 618,
      bottom: 1146
    },
  }
  return phones
}
