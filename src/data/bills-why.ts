// Пояснення «що це змінює для людей» до законопроєктів з bills.json.
// Ключ — номер законопроєкту у ВР. Пише команда, затверджує Юрій.
// Документи без пояснення показуються з позначкою «пояснення готується».
// Статуси й назви сюди не дублюються: вони приходять з відкритих даних ВР (scripts/update-bills.mjs).
import type { Lang } from './site';

export const billsWhy: Record<string, Record<Lang, string>> = {
  '2386': {
    uk: 'Борги на оптовому ринку електроенергії роками тягнули за собою шахти, теплокомуненерго і постачальників. Закон запустив механізм їх реструктуризації та погашення. Для людей це стабільніша робота енергосистеми і менше ризиків для світла й тепла вдома.',
    en: 'For years, debts on the wholesale electricity market dragged down mines, district heating companies and suppliers. This law set up a mechanism to restructure and repay them. For people, it means a more stable power system and fewer risks to electricity and heating at home.',
  },
  '2390': {
    uk: 'Доповнює закон про погашення енергетичних боргів: узгоджує його з процедурами банкрутства, щоб механізм реструктуризації працював на практиці. Підписаний на початку 2025 року, після кількох років роботи над ним.',
    en: 'Complements the law on repaying energy-market debts by aligning it with bankruptcy procedures, so the restructuring mechanism works in practice. Signed in early 2025 after several years of work.',
  },
  '7238': {
    uk: 'Дає виробникам електроенергії змогу продавати її напряму покупцям за двосторонніми договорами. Ухвалений у перші місяці повномасштабної війни, щоб ринок електроенергії міг працювати в нових умовах.',
    en: 'Lets electricity producers sell power directly to buyers under bilateral contracts. Adopted in the first months of the full-scale war so the electricity market could keep working in new conditions.',
  },
  '2528': {
    uk: 'Створила тимчасову слідчу комісію, щоб з\'ясувати, чому вугільні підприємства працюють у збиток. Від відповіді залежать зарплати шахтарів і майбутнє шахтарських міст.',
    en: 'Set up a temporary investigative commission to find out why coal companies operate at a loss. Miners\' wages and the future of mining towns depend on the answer.',
  },
  '5789': {
    uk: 'Депутатський запит до Президента щодо житла для ветерана війни та ліквідатора аварії на ЧАЕС. Так звернення однієї людини стає офіційною вимогою до держави.',
    en: 'An official MP inquiry to the President about housing for a war veteran and Chornobyl clean-up worker. This is how one person\'s appeal becomes an official demand to the state.',
  },
  '6232': {
    uk: 'Пропонує план реформування вугільної галузі: що робити з шахтами і як підтримати людей, які на них працюють. Для шахтарських громад, зокрема Львівсько-Волинського басейну, це питання роботи й майбутнього міст.',
    en: 'Proposes a plan to reform the coal industry: what to do with the mines and how to support the people who work there. For mining communities, including the Lviv-Volyn basin, this is about jobs and the future of their towns.',
  },
  '4321': {
    uk: 'Про надійне постачання електроенергії й тепла споживачам. Мета, щоб у домівках, лікарнях і школах було світло й тепло і в складні періоди.',
    en: 'About a reliable supply of electricity and heat to consumers, so that homes, hospitals and schools have power and heating even in hard times.',
  },
  '6133': {
    uk: 'Визначає критичні газові сховища й магістральні газопроводи, щоб держава могла краще їх захищати. Це безпека постачання газу в кожен дім.',
    en: 'Defines critical gas storage facilities and trunk pipelines so the state can protect them better. It is about secure gas supply to every home.',
  },
  '5399': {
    uk: 'Пропонує податкові зміни, щоб стабілізувати розрахунки на ринку електроенергії. Менше боргів між учасниками ринку означає менше ризиків для споживачів.',
    en: 'Proposes tax changes to stabilise payments on the electricity market. Fewer debts between market players mean fewer risks for consumers.',
  },
  '6166': {
    uk: 'Пропонував передбачити в бюджеті кошти на погашення боргів із зарплати шахтарям. Законопроєкт знято з розгляду, але сама проблема лишається.',
    en: 'Proposed budget funds to pay off wage arrears to miners. The bill was withdrawn, but the problem itself remains.',
  },
  '10080': {
    uk: 'Визначає, що відбувається з майном людей і підприємств в умовах воєнного чи надзвичайного стану, щоб правила були зрозумілими і передбачуваними.',
    en: 'Sets out what happens to the property of people and businesses under martial law or a state of emergency, so the rules are clear and predictable.',
  },
  '4356': {
    uk: 'Мав спростити енергосервіс: утеплення лікарень, шкіл і будинків, яке оплачується з грошей, зекономлених на енергії. Знято з розгляду, але сама ідея лишається актуальною.',
    en: 'Aimed to simplify energy service contracts, where insulating hospitals, schools and homes is paid for from the money saved on energy. Withdrawn, but the idea remains relevant.',
  },
};
