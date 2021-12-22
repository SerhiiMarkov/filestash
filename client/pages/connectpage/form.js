import React, { useState, useEffect } from "react";
import { Card, Button, FormBuilder } from "../../components/";
import {
    settings_get, settings_put, createFormBackend, FormObjToJSON, nop,
} from "../../helpers/";
import { Backend } from "../../model/";
import { t } from "../../locales/";
import "./form.scss";

/*
 * This is the automatic form generation that we uses in:
 * login page, admin console, form filetype (eg: mysql & ldap plugin)
 *
 * FAQ:
 * Why reinvent the wheel? no existing library were fitting all the use cases so we made our own
 * How does that work?
 *   1. window.CONFIG["connection"] contains all the valid connections one can make with all sort
        of prefilled data
 *   2. Backend.all gives the specs of the login form as generated by the relevant backend plugin
 *   3. The FormBuilder component generates the form from the specs generated by createFormBackend
 */

export function Form({
    onLoadingChange = nop, onError = nop, onSubmit = nop,
}) {
    const [enabledBackends, setEnabledBackends] = useState([]);
    const [selectedTab, setSelectedTab] = useState(null);

    useEffect(() => {
        Backend.all().then((backend) => {
            onLoadingChange(false);
            const backends = window.CONFIG["connections"].reduce((acc, conn) => {
                const f = createFormBackend(backend, conn);
                if (Object.keys(f).length > 0) {
                    acc.push(f);
                }
                return acc;
            }, []);
            setEnabledBackends(backends);
            setSelectedTab((function() {
                const select = settings_get("login_tab");
                if (select !== null && select < backends.length) {
                    setSelectedTab(select);
                }
                if (backends.length === 0) return null;
                else if (backends.length < 4) return 0;
                else if (backends.length < 5) return 1;
                return 2;
            }()));
        }).catch((err) => onError(err));

        return () => {
            settings_put("login_tab", selectedTab);
        };
    }, []);

    const onFormChange = (p) => {
        setEnabledBackends(enabledBackends.map((backend) => (backend)));
    };
    const onSubmitForm = (e) => {
        e.preventDefault();
        const formData = FormObjToJSON((() => {
            const tmp = enabledBackends[selectedTab];
            return tmp[Object.keys(tmp)[0]];
        })());
        delete formData["image"];
        delete formData["label"];
        delete formData["advanced"];
        onSubmit(formData);
    };
    const onTypeChange = (tabn) => {
        setSelectedTab(tabn);
    };

    const renderForm = ($input, props, struct, onChange) => {
        if (struct.type === "image") {
            return (
                <div className="center">
                    { $input }
                </div>
            );
        } else if (struct.enabled === true) {
            return null;
        } else if (struct.label === "advanced") {
            return (
                <label style={{ color: "rgba(0,0,0,0.4)" }}>
                    { $input }
                    { t("Advanced") }
                </label>
            );
        }
        return (
            <label htmlFor={props.params["id"]}
                className={`no-select input_type_${props.params["type"]}`}>
                <div>
                    { $input }
                </div>
            </label>
        );
    };

    return (
        <div className="no-select component_page_connection_form">
            {
                enabledBackends.length > 1 && (
                    <Card role="navigation"
                        className={`buttons ${((window.innerWidth < 600) ? "scroll-x" : "")}`}>
                        {
                            enabledBackends.map((backend, i) => {
                                const key = Object.keys(backend)[0];
                                if (!backend[key]) return null;
                                return (
                                    <Button
                                        key={`menu-${i}`}
                                        className={i === selectedTab ? "active primary" : ""}
                                        onClick={() => onTypeChange(i)}
                                    >
                                        { backend[key].label.value }
                                    </Button>
                                );
                            })
                        }
                    </Card>
                )
            }
            <Card className="formBody">
                <form onSubmit={(e) => onSubmitForm(e)} autoComplete="off" autoCapitalize="off"
                    spellCheck="false" autoCorrect="off">
                    {
                        enabledBackends.map((form, i) => {
                            const key = Object.keys(form)[0];
                            if (!form[key]) return null; // TODO: this shouldn't be needed
                            else if (selectedTab !== i) return null;
                            return (
                                <FormBuilder form={form[key]} onChange={onFormChange} key={"form"+i}
                                    render={renderForm} />
                            );
                        })
                    }
                    <Button theme="emphasis">{ t("CONNECT") }</Button>
                </form>
            </Card>
        </div>
    );
}
