/* eslint-disable import/order */
import BloodDeathKnight from './deathknight/blood/CONFIG';
import UnholyDeathKnight from './deathknight/unholy/CONFIG';
import FrostDeathKnight from './deathknight/frost/CONFIG';

import HavocDemonHunter from './demonhunter/havoc/CONFIG';
import VengeanceDemonHunter from './demonhunter/vengeance/CONFIG';

import BalanceDruid from '@wowanalyzer/druid-balance';
import FeralDruid from '@wowanalyzer/druid-feral';
import GuardianDruid from '@wowanalyzer/druid-guardian';
import RestoDruid from '@wowanalyzer/druid-restoration';

import BeastMasteryHunter from './hunter/beastmastery/CONFIG';
import MarksmanshipHunter from './hunter/marksmanship/CONFIG';
import SurvivalHunter from './hunter/survival/CONFIG';

import FrostMage from './mage/frost/CONFIG';
import FireMage from './mage/fire/CONFIG';
import ArcaneMage from './mage/arcane/CONFIG';

import BrewmasterMonk from '@wowanalyzer/monk-brewmaster';
import WindwalkerMonk from '@wowanalyzer/monk-windwalker';
import MistweaverMonk from '@wowanalyzer/monk-mistweaver';

import HolyPaladin from '@wowanalyzer/paladin-holy';
import RetributionPaladin from '@wowanalyzer/paladin-retribution';
import ProtectionPaladin from '@wowanalyzer/paladin-protection';

import DisciplinePriest from './priest/discipline/CONFIG';
import HolyPriest from './priest/holy/CONFIG';
import ShadowPriest from './priest/shadow/CONFIG';

import SubtletyRogue from './rogue/subtlety/CONFIG';
import AssassinationRogue from './rogue/assassination/CONFIG';
import OutlawRogue from './rogue/outlaw/CONFIG';

import ElementalShaman from './shaman/elemental/CONFIG';
import EnhancementShaman from './shaman/enhancement/CONFIG';
import RestorationShaman from './shaman/restoration/CONFIG';

import AfflictionWarlock from './warlock/affliction/CONFIG';
import DemonologyWarlock from './warlock/demonology/CONFIG';
import DestructionWarlock from './warlock/destruction/CONFIG';

import ProtectionWarrior from './warrior/protection/CONFIG';
import ArmsWarrior from './warrior/arms/CONFIG';
import FuryWarrior from './warrior/fury/CONFIG';

import Config from './Config';

const configs: Config[] = [
  BloodDeathKnight,
  UnholyDeathKnight,
  FrostDeathKnight,

  HavocDemonHunter,
  VengeanceDemonHunter,

  BalanceDruid,
  FeralDruid,
  GuardianDruid,
  RestoDruid,

  BeastMasteryHunter,
  MarksmanshipHunter,
  SurvivalHunter,

  FrostMage,
  FireMage,
  ArcaneMage,

  BrewmasterMonk,
  WindwalkerMonk,
  MistweaverMonk,

  HolyPaladin,
  RetributionPaladin,
  ProtectionPaladin,

  DisciplinePriest,
  HolyPriest,
  ShadowPriest,

  SubtletyRogue,
  AssassinationRogue,
  OutlawRogue,

  ElementalShaman,
  EnhancementShaman,
  RestorationShaman,

  AfflictionWarlock,
  DemonologyWarlock,
  DestructionWarlock,

  ProtectionWarrior,
  ArmsWarrior,
  FuryWarrior,
];

export default configs;
