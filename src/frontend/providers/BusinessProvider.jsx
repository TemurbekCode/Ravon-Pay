import { useEffect, useState } from 'react';
import { businessService } from '../../services/businessService.js';
import { paymentService } from '../../services/paymentService.js';
import { cardService } from '../../services/cardService.js';
import { notificationService } from '../../services/notificationService.js';
import { BusinessContext } from './BusinessContext.js';

export function BusinessProvider({ children }) {
  const [revenue, setRevenue] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [avgOrder, setAvgOrder] = useState(0);
  const [baseline, setBaseline] = useState({ revenue: 0, salesCount: 0, avgOrder: 0 });
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  const [links, setLinks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [checkoutPages, setCheckoutPages] = useState([]);
  const [team, setTeam] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [cards, setCards] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [subscription, setSubscription] = useState({ active: false, plan: '', founder: false });
  const [loading, setLoading] = useState(true);

  const loadBusinessData = async () => {
    const [overview, balRes, invRes, chkRes, teamRes, custRes, txRes, notifRes] = await Promise.all([
      businessService.getOverview(),
      businessService.getBalance(),
      businessService.listInvoices(),
      businessService.listCheckoutPages(),
      businessService.listTeam(),
      businessService.listCustomers(),
      businessService.listTransactions(),
      notificationService.list(),
    ]);
    setRevenue(overview.revenue ?? 0);
    setSalesCount(overview.salesCount ?? 0);
    setAvgOrder(overview.avgOrder ?? 0);
    setBaseline(overview.baseline ?? { revenue: overview.revenue ?? 0, salesCount: overview.salesCount ?? 0, avgOrder: overview.avgOrder ?? 0 });
    setLinks(overview.links ?? []);
    setBalance(balRes.balance ?? { available: 0, pending: 0 });
    setPayouts(balRes.payouts ?? []);
    setInvoices(invRes.invoices ?? []);
    setCheckoutPages(chkRes.checkoutPages ?? []);
    setTeam(teamRes.team ?? []);
    setCustomers(custRes.customers ?? []);
    setTransactions(txRes.transactions ?? []);
    setNotifications(notifRes.notifications ?? []);
  };

  // Avval obuna holatini tekshiradi — faqat faol (yoki founder) bo'lsa qolgan
  // biznes ma'lumotlarini yuklaydi (aks holda backend 402 bilan rad etadi).
  // Kartalar ro'yxati obunadan qat'i nazar yuklanadi (majburiy to'lov oynasida
  // ham mavjud kartani tanlab to'lash imkoni bo'lishi uchun).
  useEffect(() => {
    cardService.listCards().then((res) => setCards(res.cards ?? [])).catch(() => {});
    businessService.getSubscription()
      .then((subRes) => {
        setSubscription(subRes);
        if (!subRes.active && !subRes.founder) return null;
        return loadBusinessData();
      })
      .finally(() => setLoading(false));
  }, []);

  // To'lovni amalga oshiradi — mavjud kartani tanlagan bo'lsa cardId, aks holda
  // haqiqiy karta ma'lumotlarini yuboradi (backend tekshirib, kartani saqlaydi).
  const subscribe = async (plan, cardPayload) => {
    const res = await businessService.subscribe(plan, cardPayload);
    setSubscription(res);
    if (res.card) setCards((cs) => [...cs, res.card]);
    if (res.active || res.founder) await loadBusinessData();
    return res;
  };

  const withdraw = async (amount, cardId) => {
    const res = await businessService.withdraw({ amount, cardId });
    setBalance(res.balance);
    setPayouts(res.payouts);
    setNotifications(res.notifications ?? []);
    return res;
  };

  const payUtility = async (category, account, amount) => {
    const res = await businessService.payUtility({ category, account, amount });
    setBalance(res.balance);
    setTransactions(res.transactions);
    setNotifications(res.notifications ?? []);
    return res;
  };

  const addCard = async (data) => {
    const card = await cardService.createCard(data);
    setCards((cs) => [...cs, card]);
    return card;
  };

  const createLink = async (title, amount) => {
    const res = await paymentService.createLink({ title, amount });
    setLinks((ls) => [res, ...ls]);
    return res;
  };

  const createInvoice = async (client, due, amount) => {
    const res = await businessService.createInvoice({ client, due, amount });
    setInvoices((inv) => [res, ...inv]);
    return res;
  };

  const markInvoicePaid = async (id) => {
    const res = await businessService.markInvoicePaid(id);
    setRevenue(res.revenue);
    setSalesCount(res.salesCount);
    setAvgOrder(res.avgOrder);
    setBalance(res.balance);
    setInvoices(res.invoices);
    setTransactions(res.transactions);
    setCustomers(res.customers);
    setNotifications(res.notifications ?? []);
    return res;
  };

  const markNotificationsRead = async () => {
    const res = await notificationService.markAllRead();
    setNotifications(res.notifications ?? []);
    return res;
  };

  const createCheckoutPage = async (title) => {
    const res = await businessService.createCheckoutPage({ title });
    setCheckoutPages((pages) => [res, ...pages]);
    return res;
  };

  const toggleCheckoutPage = async (id) => {
    const res = await businessService.toggleCheckoutPage(id);
    setCheckoutPages(res.checkoutPages);
    return res;
  };

  const inviteTeamMember = async (email, role) => {
    const res = await businessService.inviteTeamMember({ email, role });
    setTeam((t) => [...t, res]);
    return res;
  };

  const value = {
    revenue, salesCount, avgOrder, baseline, balance, links, invoices, checkoutPages, team, customers,
    transactions, payouts, cards, notifications, subscription, loading,
    withdraw, payUtility, createLink, createInvoice, markInvoicePaid, createCheckoutPage, toggleCheckoutPage, inviteTeamMember, markNotificationsRead, subscribe, addCard,
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}
