import { Thing } from "../../types";
import styles from "./Card.module.scss";

type Props = {
  thing: Thing;
};

export default function Card(props: Props) {
  return <div class={styles.card}>{props.thing.name}</div>;
}
