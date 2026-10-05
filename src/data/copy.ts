/**
 * Customer-facing message copy. English is final; Hinglish and Hindi are drafts
 * that need native-speaker review before any real use.
 * Rupee amounts are passed in from the model, never typed here.
 */
export type Lang = 'en' | 'hinglish' | 'hi'

export const LANGS: { value: Lang; label: string; needsReview: boolean }[] = [
  { value: 'en', label: 'English', needsReview: false },
  { value: 'hinglish', label: 'Hinglish', needsReview: true },
  { value: 'hi', label: 'हिन्दी', needsReview: true },
]

export interface OrderCtx {
  name: string
  id: string
  item: string
  amount: string
  day: string
  slot: string
  upiPrice: string
  upiOff: string
}

type Msg = (o: OrderCtx) => string

export const COPY: Record<Lang, {
  t48: Msg; t24: Msg; ivr: Msg; hub: Msg
  confirmAck: Msg; rescheduleAsk: Msg; rescheduleAck: (o: OrderCtx, slot: string) => string
  cancelAck: Msg; notMineAck: Msg; upiOffer: Msg; upiAck: Msg
  btn: { confirm: string; reschedule: string; cancel: string; notMine: string; upi: (o: OrderCtx) => string }
}> = {
  en: {
    t48: (o) => `Hi ${o.name}, your Meesho order ${o.id} (${o.item}, ${o.amount} cash on delivery) arrives ${o.day}. Will you be able to receive it?`,
    t24: (o) => `Reminder: ${o.item} arrives tomorrow between ${o.slot}. Reply to confirm, pick another time, or cancel.`,
    ivr: (o) => `Automated call: "Your order ${o.id} arrives today between ${o.slot}. Press 1 to confirm, 2 to reschedule, 3 to cancel."`,
    hub: (o) => `Hub Salem West will call you before dispatch about order ${o.id}.`,
    confirmAck: (o) => `Thanks, you're confirmed for ${o.day}, ${o.slot}. Keep ${o.amount} ready, or pay by UPI now and save ${o.upiOff}.`,
    rescheduleAsk: () => 'Pick a time that suits you:',
    rescheduleAck: (_o, slot) => `Done. Your parcel now arrives ${slot}. No extra charge.`,
    cancelAck: (o) => `Order ${o.id} is cancelled. It will not be dispatched, and nothing is charged.`,
    notMineAck: (o) => `Thanks for telling us. Order ${o.id} is on hold at the hub and the seller has been alerted. You won't be charged.`,
    upiOffer: (o) => `Pay ${o.upiPrice} by UPI now (${o.upiOff} off) and skip the cash at the door.`,
    upiAck: () => `Payment received. Your rider will not need cash.`,
    btn: { confirm: 'Yes, deliver', reschedule: 'Change time', cancel: 'Cancel order', notMine: "I didn't order this", upi: (o) => `Pay ${o.upiPrice} by UPI` },
  },
  hinglish: {
    t48: (o) => `Hi ${o.name}, aapka Meesho order ${o.id} (${o.item}, ${o.amount} COD) ${o.day} ko aa raha hai. Kya aap le paayenge?`,
    t24: (o) => `Yaad dilaa rahe hain: ${o.item} kal ${o.slot} ke beech aayega. Confirm karein, time badlein, ya cancel karein.`,
    ivr: (o) => `Automated call: "Aapka order ${o.id} aaj ${o.slot} ke beech aayega. Confirm ke liye 1, time badalne ke liye 2, cancel ke liye 3 dabayein."`,
    hub: (o) => `Salem West hub dispatch se pehle order ${o.id} ke baare mein aapko call karega.`,
    confirmAck: (o) => `Thank you, ${o.day} ${o.slot} confirm ho gaya. ${o.amount} ready rakhein, ya abhi UPI se pay karke ${o.upiOff} bachaayein.`,
    rescheduleAsk: () => 'Apna time chunein:',
    rescheduleAck: (_o, slot) => `Ho gaya. Parcel ab ${slot} aayega. Koi extra charge nahi.`,
    cancelAck: (o) => `Order ${o.id} cancel ho gaya. Dispatch nahi hoga, koi charge nahi.`,
    notMineAck: (o) => `Batane ke liye shukriya. Order ${o.id} hub par hold hai aur seller ko alert kiya gaya hai. Aapse koi charge nahi.`,
    upiOffer: (o) => `Abhi UPI se ${o.upiPrice} pay karein (${o.upiOff} off), door par cash ki zaroorat nahi.`,
    upiAck: () => 'Payment mil gaya. Rider ko cash nahi chahiye.',
    btn: { confirm: 'Haan, deliver karo', reschedule: 'Time badlo', cancel: 'Cancel karo', notMine: 'Maine order nahi kiya', upi: (o) => `UPI se ${o.upiPrice} pay karo` },
  },
  hi: {
    t48: (o) => `नमस्ते ${o.name}, आपका Meesho ऑर्डर ${o.id} (${o.item}, ${o.amount} कैश ऑन डिलीवरी) ${o.day} को आएगा। क्या आप इसे ले पाएंगे?`,
    t24: (o) => `याद दिला रहे हैं: ${o.item} कल ${o.slot} के बीच आएगा। पुष्टि करें, समय बदलें, या रद्द करें।`,
    ivr: (o) => `स्वचालित कॉल: "आपका ऑर्डर ${o.id} आज ${o.slot} के बीच आएगा। पुष्टि के लिए 1, समय बदलने के लिए 2, रद्द करने के लिए 3 दबाएं।"`,
    hub: (o) => `Salem West हब डिस्पैच से पहले ऑर्डर ${o.id} के बारे में आपको कॉल करेगा।`,
    confirmAck: (o) => `धन्यवाद, ${o.day} ${o.slot} पक्का हो गया। ${o.amount} तैयार रखें, या अभी UPI से भुगतान करके ${o.upiOff} बचाएं।`,
    rescheduleAsk: () => 'अपना समय चुनें:',
    rescheduleAck: (_o, slot) => `हो गया। पार्सल अब ${slot} आएगा। कोई अतिरिक्त शुल्क नहीं।`,
    cancelAck: (o) => `ऑर्डर ${o.id} रद्द हो गया। यह डिस्पैच नहीं होगा, कोई शुल्क नहीं।`,
    notMineAck: (o) => `बताने के लिए धन्यवाद। ऑर्डर ${o.id} हब पर रोका गया है और विक्रेता को सूचित किया गया है। आपसे कोई शुल्क नहीं लिया जाएगा।`,
    upiOffer: (o) => `अभी UPI से ${o.upiPrice} भुगतान करें (${o.upiOff} छूट), दरवाज़े पर नकद की ज़रूरत नहीं।`,
    upiAck: () => 'भुगतान मिल गया। राइडर को नकद नहीं चाहिए।',
    btn: { confirm: 'हां, डिलीवर करें', reschedule: 'समय बदलें', cancel: 'ऑर्डर रद्द करें', notMine: 'यह ऑर्डर मैंने नहीं किया', upi: (o) => `UPI से ${o.upiPrice} भरें` },
  },
}
