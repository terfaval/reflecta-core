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
}: {
  icon: ComponentType<any>;
  color: string;
}) => (
  <div style={{ width: '100%', height: '100%', color }}>
    <Icon style={{ width: '100%', height: '100%' }} />
  </div>
);