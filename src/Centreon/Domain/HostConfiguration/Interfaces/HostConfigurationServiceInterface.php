<?php

/*
 * Copyright 2005 - 2019 Centreon (https://www.centreon.com/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * For more information : contact@centreon.com
 *
 */
declare(strict_types=1);

namespace Centreon\Domain\HostConfiguration\Interfaces;

use Centreon\Domain\HostConfiguration\Host;
use Centreon\Domain\HostConfiguration\HostConfigurationException;
use Centreon\Domain\HostConfiguration\HostMacro;

interface HostConfigurationServiceInterface
{
    /**
     * Add a host.
     *
     * @param Host $host
     * @return int Returns the host id
     * @throws HostConfigurationException
     */
    public function addHost(Host $host): int;

    /**
     * Find a host.
     *
     * @param int $hostId Host Id to be found
     * @return Host|null Returns a host otherwise null
     * @throws HostConfigurationException
     */
    public function findHost(int $hostId): ?Host;

    /**
     * Returns the number of host.
     *
     * @return int Number of host
     * @throws HostConfigurationException
     */
    public function getNumberOfHosts(): int;

    /**
     * Find and add all host templates in the given host.
     *
     * **The priority order of host templates is maintained!**
     *
     * @param Host $host Host for which we want to find and add all host templates
     * @throws HostConfigurationException
     */
    public function findAndAddHostTemplates(Host $host): void;

    /**
     * Find all host macros for the host.
     *
     * @param int $hostId Id of the host
     * @param bool $isUsingInheritance Indicates whether to use inheritance to find host macros (FALSE by default)
     * @return HostMacro[] List of host macros found
     * @throws HostConfigurationException
     */
    public function findOnDemandHostMacros(int $hostId, bool $isUsingInheritance = false): array;

    /**
     * Find all on-demand host macros of type password needed for this command.
     *
     * @param int $hostId Host id
     * @param string $command Command to analyse
     * @return HostMacro[] List of host macros of type password
     * @throws HostConfigurationException
     */
    public function findHostMacrosPassword(int $hostId, string $command): array;

    /**
     * Change the activation status of host.
     *
     * @param int $hostId Host id for which we want to change the activation status
     * @param bool $shouldBeActivated TRUE to activate a host
     * @throws HostConfigurationException
     */
    public function changeActivationStatus(int $hostId, bool $shouldBeActivated): void;

    /**
     * Checks if names are already used by hosts.
     *
     * @param string[] $namesToCheck List of names to check if they are already used by hosts
     * @return array<string, bool> Returns Name-indexed list with control status
     * @throws HostConfigurationException
     */
    public function checkNamesAlreadyUsed(array $namesToCheck): array;
}
