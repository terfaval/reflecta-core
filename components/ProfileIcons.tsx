import { ComponentType } from 'react';
import * as Icons from '@/components/icons';

export const iconMap: Record<string, ComponentType<any>> = {
  AkaszaIcon: Icons.AkaszaIcon,
  EanaIcon: Icons.EanaIcon,
  LumaIcon: Icons.LumaIcon,
  SylvaIcon: Icons.SylvaIcon,
  ZentoIcon: Icons.ZentoIcon,
  KairosIcon: Icons.KairosIcon,
  ReflectaIcon: Icons.ReflectaIcon,
  OneirosIcon: Icons.OneirosIcon,
  SolunIcon: Icons.SolunIcon,
  NoeIcon: Icons.NoeIcon,
  PreceptorIcon: Icons.PreceptorIcon,
};

export const ProfileIcon = ({
  icon: Icon,
  color,
  size = '100%',
}: {
  icon: ComponentType<any>;
  color: string;
  size?: string | number;
}) => (
  <Icon
    style={{ width: size, height: size, color, fill: 'currentColor' }}
  />
);