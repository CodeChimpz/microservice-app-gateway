import {ServiceRegistry} from 'mein-etcd-service-registry';
import {config} from "dotenv";
config()
export const registry = new ServiceRegistry({
    // auth: {
    //     username: String(process.env.ETCD_USER),
    //     password: String(process.env.ETCD_PASS),
    // },
    hosts: String(process.env.ETCD_HOST)
})