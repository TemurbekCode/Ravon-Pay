import { useEffect, useState } from 'react';
import { paymentService } from '../../services/paymentService.js';
import { cardService } from '../../services/cardService.js';
import { notificationService } from '../../services/notificationService.js';
import { WalletContext } from './WalletContext.js';

export function WalletProvider({ children }) {
  const [balance, setBalance] = useState(0);
  const [baseline, setBaseline] = useState({ balance: 0 });
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      paymentService.getBalance(),
      cardService.listCards(),
      paymentService.getTransactions(),
      paymentService.getContacts(),
      notificationService.list(),
    ])
      .then(([balRes, cardsRes, txRes, contactsRes, notifRes]) => {
        setBalance(balRes.balance ?? 0);
        setBaseline(balRes.baseline ?? { balance: 0 });
        setCards(cardsRes.cards ?? []);
        setTransactions(txRes.transactions ?? []);
        setContacts(contactsRes.contacts ?? []);
        setNotifications(notifRes.notifications ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const send = async (recipient, amount, recipientType) => {
    const res = await paymentService.send({ recipient, amount, recipientType });
    setBalance(res.balance);
    setTransactions(res.transactions);
    setNotifications(res.notifications ?? []);
    return res;
  };

  const topUp = async (amount) => {
    const res = await paymentService.topUp({ amount });
    // Real to'lov provayderi (Payme/Click) yoqilgan bo'lsa, backend pulni
    // darhol emas, foydalanuvchi checkout'da to'lagach webhook orqali qo'shadi —
    // hozircha uni checkout sahifasiga yo'naltiramiz.
    if (res.mode === 'redirect') {
      window.location.href = res.checkoutUrl;
      return res;
    }
    setBalance(res.balance);
    setTransactions(res.transactions);
    setNotifications(res.notifications ?? []);
    return res;
  };

  const withdraw = async (amount, cardId, twoFaCode) => {
    const res = await paymentService.withdraw({ amount, cardId, twoFaCode });
    setBalance(res.balance);
    setTransactions(res.transactions);
    setNotifications(res.notifications ?? []);
    return res;
  };

  const payUtility = async (category, account, amount) => {
    const res = await paymentService.payUtility({ category, account, amount });
    setBalance(res.balance);
    setTransactions(res.transactions);
    setNotifications(res.notifications ?? []);
    return res;
  };

  const markNotificationsRead = async () => {
    const res = await notificationService.markAllRead();
    setNotifications(res.notifications ?? []);
    return res;
  };

  const addCard = async (data) => {
    const card = await cardService.createCard(data);
    setCards((cs) => [...cs, card]);
    return card;
  };

  const freezeCard = async (id) => {
    const res = await cardService.freezeCard(id);
    setCards(res.cards);
    return res;
  };

  const deleteCard = async (id) => {
    const res = await cardService.deleteCard(id);
    setCards(res.cards);
    return res;
  };

  const addContact = async (name, phone) => {
    const contact = await paymentService.addContact({ name, phone });
    setContacts((cs) => [...cs, contact]);
    return contact;
  };

  const value = {
    balance, baseline, cards, transactions, contacts, notifications, loading,
    send, topUp, withdraw, payUtility, addCard, freezeCard, deleteCard, addContact, markNotificationsRead,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
